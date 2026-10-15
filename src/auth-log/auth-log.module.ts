import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthLogService } from './auth-log.service';

@Module({
  imports: [PrismaModule],
  providers: [AuthLogService],
  exports: [AuthLogService],
})
export class AuthLogModule {}
