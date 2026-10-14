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
import { buildOrder } from 'src/common/pagination/utils/build-order.util';

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

    // Validar, registrar el pago y recalcular el saldo dentro de una misma
    // transacción. El `FOR UPDATE` bloquea la fila de la deuda hasta el commit:
    // sin él, dos pagos simultáneos podían leer el mismo saldo y dejarlo mal.
    const payment = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Debt" WHERE id = ${debtId} FOR UPDATE`;

      const debt = await tx.debt.findUnique({ where: { id: debtId } });

      if (!debt) throw new NotFoundException('Deuda no encontrada');

      if (debt.businessId !== businessId) {
        throw new BadRequestException(
          'La deuda no pertenece al negocio activo',
        );
      }

      if (debt.status === DebtStatus.PAID && type === PaymentType.PAYMENT) {
        throw new BadRequestException('La deuda ya está saldada');
      }

      if (type === PaymentType.PAYMENT && amount <= 0) {
        throw new BadRequestException('El abono debe ser mayor a cero');
      }

      if (
        type === PaymentType.PAYMENT &&
        new Prisma.Decimal(amount).gt(debt.balance)
      ) {
        throw new BadRequestException(
          `El pago no puede ser mayor al saldo actual (${debt.balance.toString()})`,
        );
      }

      if (debt.status === DebtStatus.CANCELLED) {
        throw new BadRequestException(
          'La deuda fue cancelada, no se pueden registrar pagos',
        );
      }

     
      const created = await tx.payment.create({
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
      await this.recalculateDebtBalance(debtId, userId, tx);

      return created;
    });

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

    if (debt.status === DebtStatus.CANCELLED) {
      throw new BadRequestException(
        'No se pueden recalcular deudas canceladas',
      );
    }

    const baseAmount = debt.amount;

    // Reducir por pagos, sumar por ajustes y reversos. Se opera con Decimal y
    // no con `number`: la aritmética de punto flotante acumula errores de
    // redondeo (0.1 + 0.2 !== 0.3) que terminaban en saldos con centavos de más.
    const totalAfterMovements = debt.payments.reduce((acc, p) => {
      if (p.type === PaymentType.PAYMENT) return acc.minus(p.amount);
      if (p.type === PaymentType.ADJUSTMENT) return acc.plus(p.amount);
      if (p.type === PaymentType.REVERSAL) return acc.plus(p.amount);
      return acc;
    }, baseAmount);

    const newBalance = Prisma.Decimal.max(
      totalAfterMovements.toDecimalPlaces(2),
      0,
    );

    let newStatus: DebtStatus = DebtStatus.OPEN;
    if (newBalance.equals(baseAmount)) newStatus = DebtStatus.OPEN;
    else if (newBalance.gt(0) && newBalance.lt(baseAmount))
      newStatus = DebtStatus.PARTIAL;
    else if (newBalance.isZero()) newStatus = DebtStatus.PAID;

    await db.debt.update({
      where: { id: debtId },
      data: {
        balance: newBalance,
        status: newStatus,
      },
    });

    await this.auditService.log({
      userId,
      action: AuditAction.DEBT_STATUS_CHANGED,
      entity: 'Debt',
      entityId: debtId,
      meta: {
        previousBalance: baseAmount.toNumber(),
        newBalance: newBalance.toNumber(),
        status: newStatus,
      },
    });

    return newBalance.toNumber();
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

      // Bloquear las deudas pendientes del deudor para que dos pagos globales
      // simultáneos no repartan el mismo saldo.
      await tx.$queryRaw`
        SELECT id FROM "Debt"
        WHERE "debtorId" = ${debtorId}
          AND "businessId" = ${businessId}
          AND status IN ('OPEN', 'PARTIAL')
        FOR UPDATE`;

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

      const totalDebt = debts.reduce(
        (acc, d) => acc.plus(d.balance),
        new Prisma.Decimal(0),
      );

      if (new Prisma.Decimal(amount).gt(totalDebt)) {
        throw new BadRequestException(
          `El monto excede la deuda total (${totalDebt.toString()})`,
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

      let remaining = new Prisma.Decimal(amount);
      const paymentsResponse: {
        paymentId: string;
        debtId: string;
        appliedAmount: number;
        previousBalance: number;
        newBalance: number | undefined;
        status: DebtStatus | undefined;
      }[] = [];

      for (const debt of debts) {
        if (remaining.lte(0)) break;

        const paymentAmount = Prisma.Decimal.min(remaining, debt.balance);

        const payment = await tx.payment.create({
          data: {
            debtId: debt.id,
            businessId,
            amount: paymentAmount,
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
          appliedAmount: paymentAmount.toNumber(),
          previousBalance: debt.balance.toNumber(),
          newBalance: updatedDebt?.balance.toNumber(),
          status: updatedDebt?.status,
        });

        remaining = remaining.minus(paymentAmount);
      }

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

  async findByDebt(debtId: string, businessId: string, query: QueryPaymentDto) {
    const { page = 1, limit = 10, type, method, search, sortBy, order } = query;

    const where = buildWhere({
      search,
      searchFields: ['note'],
      filters: {
        debtId,
        businessId,
        ...(type && { type }),
        ...(method && { method }),
      },
    });

    return paginate(
      this.prisma.payment,
      {
        where,
        orderBy: buildOrder(sortBy, order),
        select: paymentSelect,
      },
      { page, limit },
    );
  }
}
