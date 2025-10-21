import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { BUSINESS_ROLES_KEY } from '../decorators/business-role.decorator';

@Injectable()
export class BusinessRoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      BUSINESS_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) return true;

    const request = context
      .switchToHttp()
      .getRequest<{ user?: { role: string } }>();
    const { user } = request;
    if (!user) return false;

    return requiredRoles.includes(user.businessRole);
  }
}
