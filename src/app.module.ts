import { Global, Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import configs from './config';
import { AuthModule } from './auth/auth.module';
import { BusinessModule } from './business/business.module';
import { BusinessUserModule } from './business-user/business-user.module';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: configs,
      envFilePath: `.env.${process.env.NODE_ENV || 'local'}`,
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    BusinessModule,
    BusinessUserModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
