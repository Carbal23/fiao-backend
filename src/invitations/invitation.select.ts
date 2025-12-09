export const invitationSelect = {
  id: true,
  code: true,
  email: true,
  phone: true,
  debtorId: true,
  businessId: true,
  expiresAt: true,
  status: true,
  createdAt: true,
  debtor: {
    select: { id: true, name: true, phone: true },
  },
};
