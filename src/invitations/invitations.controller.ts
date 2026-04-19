import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentBusiness } from 'src/common/decorators/current-business.decorator';
import { GetUser } from 'src/common/decorators/get-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post()
  create(
    @Body() dto: CreateInvitationDto,
    @CurrentBusiness() businessId: string,
  ) {
    return this.invitationsService.create(dto, businessId);
  }

  @Get(':code')
  getByCode(@Param('code') code: string) {
    return this.invitationsService.getByCode(code);
  }

  @Post('accept')
  accept(@Body() dto: AcceptInvitationDto, @GetUser('id') userId: string) {
    return this.invitationsService.accept(dto, userId);
  }

  @Get('business/:businessId')
  listByBusiness(@Param('businessId') businessId: string) {
    return this.invitationsService.listByBusiness(businessId);
  }
}
