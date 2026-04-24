import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentBusiness } from 'src/common/decorators/current-business.decorator';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { BusinessContextGuard } from 'src/auth/guards/business-context.guard';
import { BusinessProtected } from 'src/common/swagger/business.decorator';
import { BusinessRoleGuard } from 'src/auth/guards/business-role.guard';
import { BusinessRoles } from 'src/auth/decorators/business-role.decorator';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import {
  CreateInvitationResponseDto,
  InvitationResponseDto,
} from './dto/invitation-response.dto';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';
import { PaginatedInvitationResponseDto } from './dto/paginated-invitation-response.dto';

@UseGuards(JwtAuthGuard, BusinessRoleGuard)
@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @BusinessRoles('ADMIN', 'OWNER')
  @Post()
  @UseGuards(BusinessContextGuard)
  @BusinessProtected()
  @ApiOperation({
    summary: 'Crear invitación',
    description: `
      Permite invitar:

      - DEBTOR → vincular usuario a un deudor
      - BUSINESS_USER → agregar usuario al negocio

      Debe enviarse email o phone.
      Role es requerido si type = BUSINESS_USER.
      `,
  })
  @ApiResponse({
    status: 201,
    description: 'Invitación creada',
    type: CreateInvitationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos',
  })
  @ApiResponse({
    status: 403,
    description: 'Deudor no pertenece al negocio',
  })
  @ApiResponse({
    status: 404,
    description: 'Deudor no existe',
  })
  create(
    @Body() dto: CreateInvitationDto,
    @CurrentBusiness() businessId: string,
  ) {
    return this.invitationsService.create(dto, businessId);
  }

  @Get(':code')
  @ApiOperation({ summary: 'Obtener invitación por código' })
  @ApiResponse({
    status: 200,
    type: InvitationResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Código inválido' })
  @ApiResponse({ status: 400, description: 'Invitación usada o expirada' })
  getByCode(@Param('code') code: string) {
    return this.invitationsService.getByCode(code);
  }

  @Post('accept')
  @ApiOperation({
    summary: 'Aceptar invitación',
    description: `
      - DEBTOR → vincula el usuario autenticado al deudor
      - BUSINESS_USER → crea relación en businessUser
      `,
  })
  @ApiResponse({
    status: 201,
    description: 'Invitación aceptada',
    schema: {
      example: {
        message: 'Invitación aceptada correctamente',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Código inválido o expirado' })
  accept(@Body() dto: AcceptInvitationDto, @GetUser('id') userId: string) {
    return this.invitationsService.accept(dto, userId);
  }

  @UseGuards(BusinessContextGuard)
  @BusinessRoles('ADMIN', 'OWNER')
  @Get('business/:businessId')
  @BusinessProtected()
  @ApiOperation({ summary: 'Listar invitaciones del negocio' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'search', required: false, example: 'tienda' })
  @ApiQuery({ name: 'sortBy', required: false, example: 'createdAt' })
  @ApiQuery({ name: 'order', required: false, example: 'desc' })
  @ApiResponse({
    status: 200,
    type: PaginatedInvitationResponseDto,
  })
  listByBusiness(
    @Param('businessId') businessId: string,
    @Query() query: PaginationDto,
  ) {
    return this.invitationsService.listByBusiness(businessId, query);
  }
}
