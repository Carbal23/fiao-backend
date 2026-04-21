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

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreatePaymentDto, userId: string, businessId: string) {
    const { debtId, amount, method, type, note } = dto;

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

  async recalculateDebtBalance(debtId: string, userId: string) {
    const debt = await this.prisma.debt.findUnique({
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

    await this.prisma.debt.update({
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

  async findByDebt(debtId: string) {
    return this.prisma.payment.findMany({
      where: { debtId },
      orderBy: { paymentDate: 'desc' },
      select: paymentSelect,
    });
  }
}
