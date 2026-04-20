import { Module } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { InvitationsController } from './invitations.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { EmailProvider } from 'src/providers/email.provider';
import { AuditModule } from 'src/audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [InvitationsController],
  providers: [InvitationsService, EmailProvider],
})
export class InvitationsModule {}
