import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateDebtDto } from './dto/create-debt.dto';
import { UpdateDebtStatusDto } from './dto/update-debt-status.dto';
import { debtSelect } from './debt.select';
import { Prisma } from '@prisma/client';
import { AuditService } from 'src/audit/audit.service';
import { AuditAction } from 'src/audit/audit.types';

@Injectable()
export class DebtsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(
    createDto: CreateDebtDto,
    userId: string,
    businessIdFromHeader: string,
  ) {
    const { debtorId, amount, description, dueDate } = createDto;

    const business = await this.prisma.business.findUnique({
      where: { id: businessIdFromHeader },
    });
    if (!business) throw new NotFoundException('Negocio no encontrado');

    const debtor = await this.prisma.debtor.findUnique({
      where: { id: debtorId },
    });
    if (!debtor) throw new NotFoundException('Deudor no encontrado');

    const debt = await this.prisma.debt.create({
      data: {
        businessId: businessIdFromHeader,
        debtorId,
        amount: new Prisma.Decimal(amount),
        balance: new Prisma.Decimal(amount),
        description,
        dueDate,
        createdBy: userId,
      },
      select: debtSelect,
    });

    await this.auditService.log({
      userId,
      action: AuditAction.DEBT_CREATED,
      entity: 'Debt',
      entityId: debt.id,
      meta: {
        amount,
        debtorId,
        businessId: businessIdFromHeader,
      },
    });

    return debt;
  }

  async findByBusiness(businessId: string) {
    return this.prisma.debt.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      select: debtSelect,
    });
  }

  async findByDebtor(debtorId: string) {
    return this.prisma.debt.findMany({
      where: { debtorId },
      orderBy: { createdAt: 'desc' },
      select: debtSelect,
    });
  }

  async updateStatus(id: string, updateDto: UpdateDebtStatusDto) {
    const debt = await this.prisma.debt.findUnique({ where: { id } });
    if (!debt) throw new NotFoundException('Deuda no encontrada');

    const updated = await this.prisma.debt.update({
      where: { id },
      data: {
        status: updateDto.status,
        balance: updateDto.balance ?? debt.balance,
      },
      select: debtSelect,
    });

    await this.auditService.log({
      userId: updated.createdByUser.id,
      action: AuditAction.DEBT_STATUS_CHANGED,
      entity: 'Debt',
      entityId: debt.id,
      meta: {
        previousStatus: debt.status,
        newStatus: updateDto.status,
        previousBalance: debt.balance.toNumber(),
        newBalance: updateDto.balance ?? debt.balance.toNumber(),
      },
    });

    return updated;
  }
}
