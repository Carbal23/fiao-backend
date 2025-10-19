import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'local',
  port: parseInt(process.env.PORT || '3000', 10),
  isDev: process.env.NODE_ENV === 'development',
  isLocal: process.env.NODE_ENV === 'local',
  isProd: process.env.NODE_ENV === 'production',
}));
