import { Global, Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import configs from './config';
import { AuthModule } from './auth/auth.module';
import { BusinessModule } from './business/business.module';
import { BusinessUserModule } from './business-user/business-user.module';
import { DebtorsModule } from './debtors/debtors.module';
import { DebtsModule } from './debts/debts.module';
import { PaymentsModule } from './payments/payments.module';

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
    DebtorsModule,
    DebtsModule,
    PaymentsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
