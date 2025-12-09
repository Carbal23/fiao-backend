import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { invitationSelect } from './invitation.select';
import { InvitationStatus } from '@prisma/client';
import { randomBytes } from 'crypto';

@Injectable()
export class InvitationsService {
  constructor(private readonly prisma: PrismaService) {}

  private generateCode() {
    return randomBytes(3).toString('hex');
  }

  async create(dto: CreateInvitationDto) {
    const { businessId, debtorId, email, phone, expiresAt } = dto;

    if (!email && !phone) {
      throw new BadRequestException(
        'Debe especificar email o teléfono para enviar la invitación',
      );
    }

    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });
    if (!business) {
      throw new NotFoundException('Negocio no encontrado');
    }

    if (debtorId) {
      const debtor = await this.prisma.debtor.findUnique({
        where: { id: debtorId },
      });
      if (!debtor) throw new NotFoundException('El deudor indicado no existe');
      if (debtor.businessId !== businessId) {
        throw new ForbiddenException('El deudor no pertenece a este negocio');
      }
    }

    const code = this.generateCode();

    const invitation = await this.prisma.invitation.create({
      data: {
        businessId,
        debtorId,
        email,
        phone,
        code,
        expiresAt: expiresAt ? new Date(expiresAt) : this.defaultExpiration(),
      },
      select: invitationSelect,
    });

    return {
      message: 'Invitación creada',
      invitation,
    };
  }

  private defaultExpiration() {
    const date = new Date();
    date.setDate(date.getDate() + 7); // expira en 7 días
    return date;
  }

  async getByCode(code: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { code },
      select: invitationSelect,
    });

    if (!invitation) throw new NotFoundException('Código inválido');

    if (invitation.status === 'ACCEPTED')
      throw new BadRequestException('Esta invitación ya fue usada');

    if (new Date(invitation.expiresAt) < new Date()) {
      throw new BadRequestException('La invitación ya expiró');
    }

    return invitation;
  }

  async accept(dto: AcceptInvitationDto) {
    const { code, userId } = dto;

    const invitation = await this.getByCode(code);

    // Si es para un deudor -> vincular userId a debtor
    if (invitation?.debtorId) {
      await this.prisma.debtor.update({
        where: { id: invitation.debtorId },
        data: { userId },
      });
    }

    // marcar invitación como aceptada
    await this.prisma.invitation.update({
      where: { code },
      data: {
        status: InvitationStatus.ACCEPTED,
      },
    });

    return { message: 'Invitación aceptada correctamente' };
  }

  async listByBusiness(businessId: string) {
    return this.prisma.invitation.findMany({
      where: { businessId },
      select: invitationSelect,
      orderBy: { createdAt: 'desc' },
    });
  }
}
