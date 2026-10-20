import { Prisma } from '@prisma/client';
import {
  COLOMBIA_PHONE_PATTERN,
  normalizeEmail,
  normalizePhone,
} from './contact.validators';

/**
 * Condiciones para encontrar a un usuario por el dato que escriba (correo,
 * teléfono o documento), en cualquier formato: "Juan@Correo.com",
 * "+57 300 123 4567" o "1.032.876.361" encuentran lo que se guardó como
 * "juan@correo.com", "3001234567" o "1032876361".
 */
export function userIdentifierConditions(
  identifier: string,
): Prisma.UserWhereInput[] {
  const value = identifier.trim();
  const conditions: Prisma.UserWhereInput[] = [];

  if (value.includes('@')) {
    conditions.push({ email: normalizeEmail(value) as string });
  }

  const phone = normalizePhone(value) as string;
  if (COLOMBIA_PHONE_PATTERN.test(phone)) {
    conditions.push({ phone });
  }

  // El documento se prueba tal cual y normalizado: las cuentas creadas antes
  // de la normalización pueden tenerlo guardado con otro formato.
  const documentCandidates = [
    value,
    value.replace(/\D/g, ''),
    value.replace(/[\s.-]/g, '').toUpperCase(),
  ].filter(
    (candidate, index, all) => candidate && all.indexOf(candidate) === index,
  );
  conditions.push({ documentNumber: { in: documentCandidates } });

  return conditions;
}
