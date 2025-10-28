import { Module } from '@nestjs/common';
import { DebtorsService } from './debtors.service';
import { DebtorsController } from './debtors.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DebtorsController],
  providers: [DebtorsService],
  exports: [DebtorsService],
})
export class DebtorsModule {}
