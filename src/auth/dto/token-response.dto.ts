export class TokenResponseDto {
  userId: string;
  accessToken: string;
  accessTokenExpiresIn: string; // ej "15m" (solo para info)
  refreshToken: string;
  refreshTokenExpiresAt: string; // ISO date
}
