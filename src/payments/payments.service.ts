import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { paymentSelect } from './payment.select';
import { PaymentType, DebtStatus, Prisma } from '@prisma/client';
import { AuditService } from 'src/audit/audit.service';
import { AuditAction } from 'src/audit/audit.types';
import { CreateGlobalPaymentDto } from './dto/create-global-payment.dto';
import { QueryPaymentDto } from './dto/query-payment.dto';
import { buildWhere } from 'src/common/pagination/utils/build-where.util';
import { paginate } from 'src/common/pagination/utils/paginate.util';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreatePaymentDto, userId: string, businessId: string) {
    const { debtId, amount, method, type, note } = dto;

    if (!debtId)
      throw new BadRequestException('El ID de la deuda es requerido');
    if (!amount || amount <= 0)
      throw new BadRequestException('El monto debe ser mayor a cero');
    if (!method)
      throw new BadRequestException('El método de pago es requerido');
    if (!type)
      throw new BadRequestException('El tipo de movimiento es requerido');

    const debt = await this.prisma.debt.findUnique({
      where: { id: debtId },
      include: { payments: true },
    });

    if (!debt) throw new NotFoundException('Deuda no encontrada');

    if (debt.businessId !== businessId) {
      throw new BadRequestException('La deuda no pertenece al negocio activo');
    }

    const balance = debt.balance.toNumber();

    if (debt.status === DebtStatus.PAID && type === PaymentType.PAYMENT) {
      throw new BadRequestException('La deuda ya está saldada');
    }

    if (type === PaymentType.PAYMENT && amount <= 0) {
      throw new BadRequestException('El abono debe ser mayor a cero');
    }

    if (type === PaymentType.PAYMENT && amount > balance) {
      throw new BadRequestException(
        `El pago no puede ser mayor al saldo actual (${balance})`,
      );
    }

    // Crear pago (usar Prisma.Decimal para amounts)
    const payment = await this.prisma.payment.create({
      data: {
        debtId,
        businessId: debt.businessId,
        amount: new Prisma.Decimal(amount),
        method,
        type,
        note,
        createdBy: userId,
      },
      select: paymentSelect,
    });

    // Recalcular balance y estado
    await this.recalculateDebtBalance(debtId, userId);

    await this.auditService.log({
      userId,
      action:
        type === 'PAYMENT'
          ? AuditAction.PAYMENT_CREATED
          : type === 'ADJUSTMENT'
            ? AuditAction.PAYMENT_ADJUSTMENT
            : AuditAction.PAYMENT_REVERSAL,
      entity: 'Payment',
      entityId: payment.id,
      meta: {
        amount,
        type,
        method,
        debtId,
      },
    });

    return payment;
  }

  async recalculateDebtBalance(
    debtId: string,
    userId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const db = tx ?? this.prisma;

    const debt = await db.debt.findUnique({
      where: { id: debtId },
      include: {
        payments: true,
      },
    });

    if (!debt) throw new NotFoundException('Deuda no encontrada');

    const baseAmount = debt.amount.toNumber();

    // Reducir por pagos, sumar por ajustes y reversos
    const totalAfterMovements = debt.payments.reduce((acc, p) => {
      const amt = p.amount.toNumber();
      if (p.type === PaymentType.PAYMENT) return acc - amt;
      if (p.type === PaymentType.ADJUSTMENT) return acc + amt;
      if (p.type === PaymentType.REVERSAL) return acc + amt;
      return acc;
    }, baseAmount);

    const newBalance = Math.max(Math.round(totalAfterMovements * 100) / 100, 0);

    let newStatus: DebtStatus = DebtStatus.OPEN;
    if (newBalance === baseAmount) newStatus = DebtStatus.OPEN;
    else if (newBalance > 0 && newBalance < baseAmount)
      newStatus = DebtStatus.PARTIAL;
    else if (newBalance === 0) newStatus = DebtStatus.PAID;

    await db.debt.update({
      where: { id: debtId },
      data: {
        balance: new Prisma.Decimal(newBalance),
        status: newStatus,
      },
    });

    await this.auditService.log({
      userId,
      action: AuditAction.DEBT_STATUS_CHANGED,
      entity: 'Debt',
      entityId: debtId,
      meta: {
        previousBalance: baseAmount,
        newBalance,
        status: newStatus,
      },
    });

    return newBalance;
  }

  async createGlobalPayment(
    dto: CreateGlobalPaymentDto,
    userId: string,
    businessId: string,
  ) {
    const { debtorId, amount, method, note } = dto;

    if (!debtorId) {
      throw new BadRequestException('debtorId es requerido');
    }

    if (amount <= 0) {
      throw new BadRequestException('El monto debe ser mayor a cero');
    }

    return this.prisma.$transaction(async (tx) => {
      const debtor = await tx.debtor.findUnique({
        where: { id: debtorId },
      });

      if (!debtor) throw new NotFoundException('Deudor no encontrado');

      if (debtor.businessId !== businessId) {
        throw new BadRequestException(
          'El deudor no pertenece al negocio activo',
        );
      }

      const debts = await tx.debt.findMany({
        where: {
          debtorId,
          businessId,
          status: {
            in: ['OPEN', 'PARTIAL'],
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      if (!debts.length) {
        throw new BadRequestException('El deudor no tiene deudas pendientes');
      }

      const totalDebt = debts.reduce((acc, d) => acc + d.balance.toNumber(), 0);

      if (amount > totalDebt) {
        throw new BadRequestException(
          `El monto excede la deuda total (${totalDebt})`,
        );
      }

      const group = await tx.paymentGroup.create({
        data: {
          businessId,
          debtorId,
          totalAmount: new Prisma.Decimal(amount),
          createdBy: userId,
        },
      });

      let remaining = amount;
      const paymentsResponse: any[] = [];

      for (const debt of debts) {
        if (remaining <= 0) break;

        const previousBalance = debt.balance.toNumber();
        const paymentAmount = Math.min(remaining, previousBalance);

        const payment = await tx.payment.create({
          data: {
            debtId: debt.id,
            businessId,
            amount: new Prisma.Decimal(paymentAmount),
            method,
            type: PaymentType.PAYMENT,
            note,
            createdBy: userId,
            paymentGroupId: group.id,
          },
          select: paymentSelect,
        });

        await this.recalculateDebtBalance(debt.id, userId, tx);

        const updatedDebt = await tx.debt.findUnique({
          where: { id: debt.id },
          select: {
            id: true,
            balance: true,
            status: true,
          },
        });

        paymentsResponse.push({
          paymentId: payment.id,
          debtId: debt.id,
          appliedAmount: paymentAmount,
          previousBalance,
          newBalance: updatedDebt?.balance.toNumber(),
          status: updatedDebt?.status,
        });

        remaining -= paymentAmount;
      }

      // 5. Audit log (una sola entrada global, no por cada payment)
      await this.auditService.log({
        userId,
        action: AuditAction.PAYMENT_CREATED,
        entity: 'PaymentGroup',
        entityId: group.id,
        meta: {
          debtorId,
          totalAmount: amount,
          paymentsCount: paymentsResponse.length,
          businessId,
        },
      });

      return {
        message: 'Pago global aplicado',
        group: {
          id: group.id,
          totalAmount: amount,
        },
        debtor: {
          id: debtor.id,
          name: debtor.name,
        },
        summary: {
          totalApplied: amount,
          debtsAffected: paymentsResponse.length,
        },
        payments: paymentsResponse,
      };
    });
  }

  async reversePaymentGroup(
    groupId: string,
    userId: string,
    businessId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const group = await tx.paymentGroup.findUnique({
        where: { id: groupId },
        include: {
          payments: true,
        },
      });

      if (!group) {
        throw new NotFoundException('Grupo de pago no encontrado');
      }

      if (group.businessId !== businessId) {
        throw new BadRequestException('No pertenece al negocio');
      }

      if (group.reversedAt) {
        throw new BadRequestException('Este pago global ya fue reversado');
      }

      if (!group.payments.length) {
        throw new BadRequestException('No hay pagos para reversar');
      }

      const reversalPayments: any[] = [];

      for (const payment of group.payments) {
        const reversal = await tx.payment.create({
          data: {
            debtId: payment.debtId,
            businessId,
            amount: payment.amount,
            method: payment.method,
            type: PaymentType.REVERSAL,
            note: `Reversal of ${payment.id}`,
            createdBy: userId,
          },
        });

        reversalPayments.push(reversal);

        await this.recalculateDebtBalance(payment.debtId, userId, tx);
      }

      const updated = await tx.paymentGroup.updateMany({
        where: {
          id: groupId,
          reversedAt: null,
        },
        data: {
          reversedAt: new Date(),
        },
      });

      if (updated.count === 0) {
        throw new BadRequestException('Este pago ya fue reversado');
      }

      await this.auditService.log({
        userId,
        action: AuditAction.PAYMENT_REVERSAL,
        entity: 'PaymentGroup',
        entityId: group.id,
        meta: {
          reversedPayments: reversalPayments.length,
          businessId,
        },
      });

      return {
        message: 'Pago global reversado correctamente',
        reversedCount: reversalPayments.length,
      };
    });
  }

  async findAll(businessId: string, query: QueryPaymentDto) {
    const { page = 1, limit = 10, type, method, search } = query;

    const where = buildWhere({
      search,
      searchFields: ['note'],
      filters: {
        businessId,
        ...(type && { type }),
        ...(method && { method }),
      },
    });

    return paginate(
      this.prisma.payment,
      {
        where,
        orderBy: { createdAt: 'desc' },
        select: paymentSelect,
      },
      { page, limit },
    );
  }

  async findByDebt(debtId: string, query: QueryPaymentDto) {
    const { page = 1, limit = 10, type, method, search } = query;

    const where = buildWhere({
      search,
      searchFields: ['note'],
      filters: {
        debtId,
        ...(type && { type }),
        ...(method && { method }),
      },
    });

    return paginate(
      this.prisma.payment,
      {
        where,
        orderBy: { paymentDate: 'desc' },
        select: paymentSelect,
      },
      { page, limit },
    );
  }
}
