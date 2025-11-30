export const debtSelect = {
  id: true,
  amount: true,
  balance: true,
  currency: true,
  description: true,
  status: true,
  dueDate: true,
  createdAt: true,
  updatedAt: true,
  business: {
    select: {
      id: true,
      name: true,
      currency: true,
    },
  },
  debtor: {
    select: {
      id: true,
      name: true,
      phone: true,
    },
  },
  createdByUser: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
  },
};
