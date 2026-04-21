import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { extractBusinessId } from 'src/common/utils/BusinessId.util';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class BusinessContextGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<
      Request & {
        user?: { id: string; role: string };
        business?: { id: string; inactivatedAt: Date | null };
        params?: { businessId?: string };
        query?: { businessId?: string };
      }
    >();

    const { user } = request;
    if (!user) throw new UnauthorizedException('Usuario no autenticado');

    const businessId = extractBusinessId(request);

    if (!businessId) {
      throw new ForbiddenException(
        'Debe especificar el negocio activo (x-business-id)',
      );
    }

    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, inactivatedAt: true },
    });

    if (!business) {
      throw new NotFoundException('Negocio no encontrado');
    }

    if (business.inactivatedAt) {
      throw new BadRequestException('El negocio se encuentra inactivado');
    }

    request.business = business;

    return true;
  }
}
