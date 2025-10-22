import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

type RequestWithUser = Request & { user?: Record<string, unknown> };

export const GetUser = createParamDecorator(
  (data: keyof any | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    // Si pasas un campo específico (ej. 'id'), devuelve solo eso
    if (data && user && typeof user === 'object' && data in user) {
      return user[data as string];
    }

    return user;
  },
);
