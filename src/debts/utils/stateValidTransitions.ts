import { DebtStatus } from '@prisma/client';

export const validTransitions: Record<DebtStatus, DebtStatus[]> = {
  OPEN: ['PARTIAL', 'PAID', 'CANCELLED'],
  PARTIAL: ['PAID', 'CANCELLED'],
  PAID: [],
  CANCELLED: [],
};
