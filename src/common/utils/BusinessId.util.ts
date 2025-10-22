import { Request } from 'express';

/**
 * Extrae el businessId desde el header, params o query del request HTTP.
 * @param request Objeto de la petición Express
 * @returns El ID del negocio (string) o null si no está presente
 */
export function extractBusinessId(
  request: Request & {
    params?: { businessId?: string };
    query?: { businessId?: string };
  },
): string | null {
  const fromHeader = request.headers['x-business-id'] as string | undefined;
  const fromParams = request.params?.businessId;
  const fromQuery = request.query?.businessId;

  return fromHeader || fromParams || fromQuery || null;
}
