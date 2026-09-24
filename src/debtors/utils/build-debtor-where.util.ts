import { DebtStatus, Prisma } from '@prisma/client';
import { buildWhere } from 'src/common/pagination/utils/build-where.util';

export const buildDebtorWhere = (
  base: Prisma.DebtorWhereInput,
  search?: string,
  hasDebt?: boolean,
): Prisma.DebtorWhereInput => {
  const where = buildWhere({
    filters: {
      ...base,
      inactivatedAt: null,
    },
    search,
    searchFields: ['name', 'phone', 'documentNumber'],
  }) as Prisma.DebtorWhereInput;

  if (hasDebt !== undefined) {
    const withBalance = {
      some: {
        status: {
          in: [DebtStatus.OPEN, DebtStatus.PARTIAL],
        },
        balance: {
          gt: 0,
        },
      },
    };

    where.debts = hasDebt ? withBalance : { none: withBalance.some };
  }

  return where;
};
