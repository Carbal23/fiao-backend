export const paymentSelect = {
  id: true,
  amount: true,
  method: true,
  type: true,
  note: true,
  paymentDate: true,
  createdAt: true,
  createdByUser: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
  },
};
