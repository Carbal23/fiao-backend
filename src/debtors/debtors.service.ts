import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateDebtorDto } from './dto/create-debtor.dto';
import { UpdateDebtorDto } from './dto/update-debtor.dto';
import { Debtor } from '@prisma/client';
import { userSafeSelect } from 'src/users/user.select';

@Injectable()
export class DebtorsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(businessId: string, data: CreateDebtorDto): Promise<Debtor> {
    // Buscar si ya existe un user con los datos del deudor
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { documentNumber: data.documentNumber ?? undefined },
          { phone: data.phone ?? undefined },
        ],
      },
    });

    // Validar duplicado dentro del mismo negocio
    const existingDebtor = await this.prisma.debtor.findFirst({
      where: {
        businessId,
        OR: [
          { documentNumber: data.documentNumber ?? undefined },
          { phone: data.phone ?? undefined },
        ],
      },
    });

    if (existingDebtor) {
      throw new BadRequestException(
        'Ya existe un deudor con estos datos en este negocio.',
      );
    }

    const debtor = await this.prisma.debtor.create({
      data: {
        ...data,
        businessId,
        userId: existingUser?.id ?? null,
      },
    });

    return debtor;
  }

  async findAll(businessId: string): Promise<Debtor[]> {
    return this.prisma.debtor.findMany({
      where: { businessId },
      include: {
        user: { select: userSafeSelect },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<Debtor> {
    const debtor = await this.prisma.debtor.findUnique({
      where: { id },
      include: {
        business: { select: { id: true, name: true } },
        user: { select: userSafeSelect },
        debts: true,
      },
    });
    if (!debtor) throw new NotFoundException('Deudor no encontrado');
    return debtor;
  }

  async update(id: string, data: UpdateDebtorDto): Promise<Debtor> {
    const debtor = await this.prisma.debtor.findUnique({ where: { id } });
    if (!debtor) throw new NotFoundException('Deudor no encontrado');

    const updated = await this.prisma.debtor.update({
      where: { id },
      data,
    });

    return updated;
  }

  async remove(id: string): Promise<{ message: string }> {
    const debtor = await this.prisma.debtor.findUnique({ where: { id } });
    if (!debtor) throw new NotFoundException('Deudor no encontrado');

    await this.prisma.debtor.delete({ where: { id } });

    return { message: 'Deudor eliminado correctamente' };
  }
}
