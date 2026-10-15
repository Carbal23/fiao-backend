import { AuthLogEvent } from '@prisma/client';

/** Datos de la petición HTTP que acompañan a cada evento. */
export interface RequestContext {
  ipAddress?: string;
  userAgent?: string;
}

export interface AuthLogParams {
  event: AuthLogEvent;
  userId?: string | null;
  identifier?: string;
  reason?: string;
  deviceInfo?: string | null;
  context?: RequestContext;
}

/** Motivos de fallo que se guardan en `reason`. */
export enum AuthLogReason {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  AMBIGUOUS_IDENTIFIER = 'AMBIGUOUS_IDENTIFIER',
  WRONG_CURRENT_PASSWORD = 'WRONG_CURRENT_PASSWORD',
}
