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
import { InvitationStatus, InvitationType } from '@prisma/client';
import { randomBytes } from 'crypto';
import { EmailProvider } from 'src/providers/email.provider';
import { AuditService } from 'src/audit/audit.service';
import { AuditAction } from 'src/audit/audit.types';

@Injectable()
export class InvitationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailProvider: EmailProvider,
    private readonly auditService: AuditService,
  ) {}

  private generateCode() {
    return randomBytes(3).toString('hex');
  }

  async create(dto: CreateInvitationDto, businessId: string) {
    const { debtorId, email, phone, type, role, expiresAt } = dto;

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

    if (type === InvitationType.DEBTOR) {
      if (!debtorId) {
        throw new BadRequestException('Debe enviar debtorId');
      }

      const debtor = await this.prisma.debtor.findUnique({
        where: { id: debtorId },
      });

      if (!debtor) throw new NotFoundException('Deudor no existe');

      if (debtor.businessId !== businessId) {
        throw new ForbiddenException('No pertenece al negocio');
      }
    }

    if (type === InvitationType.BUSINESS_USER && !role) {
      throw new BadRequestException('Debe especificar rol');
    }

    const code = this.generateCode();

    const invitation = await this.prisma.invitation.create({
      data: {
        businessId,
        debtorId,
        email,
        phone,
        code,
        type,
        role,
        expiresAt: expiresAt ? new Date(expiresAt) : this.defaultExpiration(),
      },
      select: invitationSelect,
    });

    if (email) {
      if (type === InvitationType.DEBTOR) {
        await this.emailProvider.sendDebtorInvitation(
          email,
          code,
          business.name,
        );
      } else {
        await this.emailProvider.sendBusinessInvitation(
          email,
          code,
          business.name,
          role!,
        );
      }
    }

    await this.auditService.log({
      action: AuditAction.INVITATION_CREATED,
      entity: 'Invitation',
      entityId: invitation.id,
      meta: {
        businessId,
        email,
        phone,
        type: invitation.type,
      },
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

  async accept(dto: AcceptInvitationDto, userId: string) {
    const { code } = dto;

    const invitation = await this.getByCode(code);

    // Si es para un deudor -> vincular userId a debtor
    if (invitation.type === InvitationType.DEBTOR && invitation.debtorId) {
      await this.prisma.debtor.updateMany({
        where: {
          id: invitation.debtorId,
          userId: null,
        },
        data: { userId },
      });
    }

    if (invitation.type === InvitationType.BUSINESS_USER) {
      const existing = await this.prisma.businessUser.findFirst({
        where: {
          userId,
          businessId: invitation.businessId,
        },
      });

      if (!existing) {
        await this.prisma.businessUser.create({
          data: {
            userId,
            businessId: invitation.businessId,
            role: invitation.role || 'VIEWER',
          },
        });
      }
    }

    await this.prisma.invitation.update({
      where: { code },
      data: {
        status: InvitationStatus.ACCEPTED,
      },
    });

    await this.auditService.log({
      userId,
      action: AuditAction.INVITATION_ACCEPTED,
      entity: 'Invitation',
      entityId: invitation.id,
      meta: {
        type: invitation.type,
        businessId: invitation.businessId,
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
