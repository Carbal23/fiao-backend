import { UserSafe } from 'src/users/user.select';
export class TokenResponseDto {
  user: UserSafe;
  accessToken: string;
  accessTokenExpiresIn: string; // ej "15m" (solo para info)
  refreshToken: string;
  refreshTokenExpiresAt: string; // ISO date
}
