import { User } from '@prisma/client';

export interface CredentialsCheck {
  user: User | null;
  // Cuenta a la que apuntaba el intento, para registrar los fallos a su nombre.
  attemptedUserId: string | null;
  ambiguous: boolean;
}
