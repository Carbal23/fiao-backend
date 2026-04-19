import { Module } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { InvitationsController } from './invitations.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { EmailProvider } from 'src/providers/email.provider';

@Module({
  imports: [PrismaModule],
  controllers: [InvitationsController],
  providers: [InvitationsService, EmailProvider],
})
export class InvitationsModule {}
