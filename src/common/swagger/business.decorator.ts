import { applyDecorators } from '@nestjs/common';
import {
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiHeader,
} from '@nestjs/swagger';

export function BusinessProtected() {
  return applyDecorators(
    ApiHeader({
      name: 'x-business-id',
      required: true,
      description: 'ID del negocio activo',
    }),

    ApiForbiddenResponse({
      description:
        'No pertenece al negocio, no tiene permisos o no envió x-business-id',
    }),

    ApiNotFoundResponse({
      description: 'Negocio no encontrado',
    }),

    ApiBadRequestResponse({
      description: 'El negocio se encuentra inactivado',
    }),
  );
}
