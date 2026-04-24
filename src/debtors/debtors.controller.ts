import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { DebtorsService } from './debtors.service';
import { CreateDebtorDto } from './dto/create-debtor.dto';
import { UpdateDebtorDto } from './dto/update-debtor.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { BusinessRoleGuard } from 'src/auth/guards/business-role.guard';
import { BusinessRoles } from 'src/auth/decorators/business-role.decorator';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { BusinessContextGuard } from 'src/auth/guards/business-context.guard';
import { CurrentBusiness } from 'src/common/decorators/current-business.decorator';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BusinessProtected } from 'src/common/swagger/business.decorator';
import { DebtorResponseDto } from './dto/debtor-response.dto';
import { PaginatedDebtorResponseDto } from './dto/paginated-debtor-response.dto';
import { DebtorDetailResponseDto } from './dto/debtor-detail-response.dto';
import { ApiAuth } from 'src/common/swagger/auth.decorator';

@ApiTags('Debtors')
@UseGuards(JwtAuthGuard, BusinessContextGuard, BusinessRoleGuard)
@ApiAuth()
@BusinessProtected()
@Controller('debtors')
export class DebtorsController {
  constructor(private readonly debtorsService: DebtorsService) {}

  @Post()
  @BusinessRoles('ADMIN', 'OWNER', 'CASHIER')
  @ApiOperation({ summary: 'Crear deudor' })
  @ApiResponse({
    status: 201,
    description: 'Deudor creado',
    type: DebtorResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Ya existe un deudor con estos datos en este negocio o Error de validación',
  })
  create(
    @CurrentBusiness('businessId') businessId: string,
    @GetUser('id') currentUserId: string,
    @Body() data: CreateDebtorDto,
  ) {
    return this.debtorsService.create(businessId, currentUserId, data);
  }

  @Get()
  @ApiOperation({ summary: 'Listar deudores del negocio' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({
    status: 200,
    description: 'Listado de deudores',
    type: PaginatedDebtorResponseDto,
  })
  findAll(
    @CurrentBusiness('businessId') businessId: string,
    @Query() query: PaginationDto,
  ) {
    return this.debtorsService.findAll(businessId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de deudor' })
  @ApiResponse({
    status: 200,
    description: 'Detalle del deudor',
    type: DebtorDetailResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Deudor no encontrado o inactivo' })
  findOne(
    @Param('id') id: string,
    @CurrentBusiness('businessId') businessId: string,
  ) {
    return this.debtorsService.findOne(id, businessId);
  }

  @Patch(':id')
  @BusinessRoles('ADMIN', 'OWNER')
  @ApiOperation({ summary: 'Actualizar deudor' })
  @ApiResponse({
    status: 200,
    description: 'Deudor actualizado',
    type: DebtorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Deudor no encontrado',
  })
  update(
    @Param('id') id: string,
    @CurrentBusiness('businessId') businessId: string,
    @GetUser('id') currentUserId: string,
    @Body() data: UpdateDebtorDto,
  ) {
    return this.debtorsService.update(id, businessId, currentUserId, data);
  }

  @Patch(':id/inactivate')
  @BusinessRoles('ADMIN', 'OWNER')
  @ApiOperation({ summary: 'Inactivar deudor' })
  @ApiResponse({
    status: 200,
    description: 'Deudor inactivado',
    schema: {
      example: { message: 'Deudor inactivado correctamente' },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Deudor no encontrado',
  })
  inactivate(
    @Param('id') id: string,
    @CurrentBusiness('businessId') businessId: string,
    @GetUser('id') currentUserId: string,
  ) {
    return this.debtorsService.inactivate(id, businessId, currentUserId);
  }
}
