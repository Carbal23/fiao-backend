import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post()
  create(@Body() dto: CreateInvitationDto) {
    return this.invitationsService.create(dto);
  }

  @Get(':code')
  getByCode(@Param('code') code: string) {
    return this.invitationsService.getByCode(code);
  }

  @Post('accept')
  accept(@Body() dto: AcceptInvitationDto) {
    return this.invitationsService.accept(dto);
  }

  @Get('business/:businessId')
  listByBusiness(@Param('businessId') businessId: string) {
    return this.invitationsService.listByBusiness(businessId);
  }
}
