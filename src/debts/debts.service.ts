import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateDebtDto } from './dto/create-debt.dto';
import { UpdateDebtStatusDto } from './dto/update-debt-status.dto';
import { debtSelect } from './debt.select';
import { Prisma } from '@prisma/client';

@Injectable()
export class DebtsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createDto: CreateDebtDto,
    userId: string,
    businessIdFromHeader: string,
  ) {
    const { businessId, debtorId, amount, description, dueDate } = createDto;

    if (createDto.businessId !== businessIdFromHeader) {
      throw new ForbiddenException(
        'El businessId del body no coincide con el header x-business-id',
      );
    }

    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException('Negocio no encontrado');

    const debtor = await this.prisma.debtor.findUnique({
      where: { id: debtorId },
    });
    if (!debtor) throw new NotFoundException('Deudor no encontrado');

    const debt = await this.prisma.debt.create({
      data: {
        businessId,
        debtorId,
        amount,
        balance: new Prisma.Decimal(amount),
        description,
        dueDate,
        createdBy: userId,
      },
      select: debtSelect,
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

    return updated;
  }
}
