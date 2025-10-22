import { User } from '@prisma/client';
import { userSafeSelect } from '../user.select';

export function serializeUser(user: User | null) {
  if (!user) return null;

  const safeUser: Partial<User> = {};

  for (const key of Object.keys(userSafeSelect)) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    safeUser[key] = user[key];
  }

  return safeUser as Pick<User, keyof typeof userSafeSelect>;
}
