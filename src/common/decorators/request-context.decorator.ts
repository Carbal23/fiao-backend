import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { RequestContext } from 'src/auth-log/auth-log.types';

/** Extrae la IP y el user agent de la petición, para los registros de seguridad. */
export const ReqContext = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestContext =>
    requestContextFrom(ctx.switchToHttp().getRequest<Request>()),
);

export function requestContextFrom(request: Request): RequestContext {
  return {
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'],
  };
}
