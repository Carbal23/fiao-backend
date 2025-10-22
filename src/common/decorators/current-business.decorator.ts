import {
  createParamDecorator,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { extractBusinessId } from '../utils/BusinessId.util';

export const CurrentBusiness = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request>();

    const businessId = extractBusinessId(request);

    if (!businessId) {
      throw new BadRequestException(
        'Debe especificar el negocio activo (header: x-business-id o parámetro businessId)',
      );
    }

    return businessId as string;
  },
);
