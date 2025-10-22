import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';
import { BUSINESS_ROLES_KEY } from '../decorators/business-role.decorator';
import { extractBusinessId } from 'src/common/utils/BusinessId.util';

@Injectable()
export class BusinessRoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      BUSINESS_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest<
      Request & {
        user?: { id: string; role: string };
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

    const membership = await this.prisma.businessUser.findFirst({
      where: { userId: user.id, businessId },
      select: { role: true },
    });

    if (!membership) {
      throw new ForbiddenException('El usuario no pertenece a este negocio');
    }

    const hasRole = requiredRoles.includes(membership.role);
    if (!hasRole) {
      throw new ForbiddenException('Permisos insuficientes para este negocio');
    }

    return true;
  }
}
