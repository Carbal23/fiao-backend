import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'default_secret',
  expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  refreshTokenExpiresDays: parseInt(
    process.env.REFRESH_TOKEN_EXPIRES_DAYS || '30',
    10,
  ),
  refreshTokenHashRounds: parseInt(
    process.env.REFRESH_TOKEN_HASH_ROUNDS || '10',
    10,
  ),
}));
