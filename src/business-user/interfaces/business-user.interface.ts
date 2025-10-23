import { BusinessUserRole, User } from '@prisma/client';

export interface BusinessUserResponse {
  id: string;
  businessId: string;
  userId: string;
  role: BusinessUserRole;
  createdAt: Date;
  user: Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'phone'>;
}
