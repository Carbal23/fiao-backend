import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { paymentSelect } from './payment.select';
import { PaymentType, DebtStatus, Prisma } from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePaymentDto, userId: string) {
    const { debtId, amount, method, type, note } = dto;

    const debt = await this.prisma.debt.findUnique({
      where: { id: debtId },
      include: { payments: true },
    });

    if (!debt) throw new NotFoundException('Deuda no encontrada');

    // Validaciones básicas
    if (type === PaymentType.PAYMENT && amount <= 0) {
      throw new BadRequestException('El abono debe ser mayor a cero');
    }

    // Crear pago (usar Prisma.Decimal para amounts)
    const payment = await this.prisma.payment.create({
      data: {
        debtId,
        amount: new Prisma.Decimal(amount),
        method,
        type,
        note,
        createdBy: userId,
      },
      select: paymentSelect,
    });

    // Recalcular balance y estado
    await this.recalculateDebtBalance(debtId);

    return payment;
  }

  async recalculateDebtBalance(debtId: string) {
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
