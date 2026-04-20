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
import { AuditService } from 'src/audit/audit.service';
import { AuditAction } from 'src/audit/audit.types';

@Injectable()
export class DebtorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(
    businessId: string,
    currentUserId: string,
    data: CreateDebtorDto,
  ): Promise<Debtor> {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) throw new NotFoundException('Negocio no encontrado');

    if (business.inactivatedAt) {
      throw new BadRequestException(
        'No se pueden agregar deudores a un negocio inactivado',
      );
    }

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

    await this.auditService.log({
      userId: currentUserId,
      action: AuditAction.DEBTOR_CREATED,
      entity: 'Debtor',
      entityId: debtor.id,
      meta: {
        debtorId: debtor.id,
        name: data.name,
        documentNumber: data.documentNumber,
        phone: data.phone,
        businessId,
      },
    });

    return debtor;
  }

  async findAll(businessId: string): Promise<Debtor[]> {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException('Negocio no encontrado');

    if (business.inactivatedAt)
      throw new BadRequestException(
        'No puedes agregar usuarios a un negocio inactivado',
      );

    return this.prisma.debtor.findMany({
      where: { businessId, inactivatedAt: null },
      include: {
        user: { select: userSafeSelect },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, businessId: string): Promise<Debtor> {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException('Negocio no encontrado');

    if (business.inactivatedAt)
      throw new BadRequestException(
        'No puedes agregar usuarios a un negocio inactivado',
      );
    const debtor = await this.prisma.debtor.findUnique({
      where: { id, businessId },
      include: {
        business: { select: { id: true, name: true } },
        user: { select: userSafeSelect },
        debts: true,
      },
    });

    if (!debtor) throw new NotFoundException('Deudor no encontrado');

    if (debtor.inactivatedAt)
      throw new NotFoundException('Deudor se encuentra inactivado');

    return debtor;
  }

  async update(
    id: string,
    businessId: string,
    currentUserId: string,
    data: UpdateDebtorDto,
  ): Promise<Debtor> {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException('Negocio no encontrado');

    if (business.inactivatedAt)
      throw new BadRequestException(
        'No puedes agregar usuarios a un negocio inactivado',
      );

    const debtor = await this.prisma.debtor.findUnique({
      where: { id, businessId },
    });
    if (!debtor) throw new NotFoundException('Deudor no encontrado');

    if (debtor.inactivatedAt)
      throw new NotFoundException('Deudor se encuentra inactivado');

    const updated = await this.prisma.debtor.update({
      where: { id },
      data,
    });

    await this.auditService.log({
      userId: currentUserId,
      action: AuditAction.DEBTOR_UPDATED,
      entity: 'Debtor',
      entityId: debtor.id,
      meta: {
        debtorId: debtor.id,
        previousName: data.name,
        newName: updated.name,
        previousDocumentNumber: data.documentNumber,
        newDocumentNumber: updated.documentNumber,
        previousPhone: data.phone,
        newPhone: updated.phone,
        businessId: debtor.businessId,
      },
    });

    return updated;
  }

  async remove(
    id: string,
    businessId: string,
    currentUserId: string,
  ): Promise<{ message: string }> {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException('Negocio no encontrado');

    if (business.inactivatedAt)
      throw new BadRequestException(
        'No puedes agregar usuarios a un negocio inactivado',
      );
    const debtor = await this.prisma.debtor.findUnique({
      where: { id, businessId },
      include: { debts: true },
    });

    if (!debtor) throw new NotFoundException('Deudor no encontrado');

    if (debtor.inactivatedAt)
      throw new NotFoundException('Deudor se encuentra inactivado');

    await this.prisma.debtor.update({
      where: { id },
      data: {
        inactivatedAt: new Date(),
      },
    });

    await this.auditService.log({
      userId: currentUserId,
      action: AuditAction.DEBTOR_INACTIVATED,
      entity: 'Debtor',
      entityId: debtor.id,
      meta: {
        debtorId: debtor.id,
        businessId: debtor.businessId,
      },
    });

    return { message: 'Deudor inactivado correctamente' };
  }
}
