import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      'JWT_SECRET debe estar configurado y tener al menos 32 caracteres',
    );
  }

  return {
    secret,
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    refreshTokenExpiresDays: parseInt(
      process.env.REFRESH_TOKEN_EXPIRES_DAYS || '30',
      10,
    ),
  };
});
