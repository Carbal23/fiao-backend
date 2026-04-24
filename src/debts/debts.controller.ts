import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Headers,
  Query,
} from '@nestjs/common';
import { DebtsService } from './debts.service';
import { CreateDebtDto } from './dto/create-debt.dto';
import { UpdateDebtStatusDto } from './dto/update-debt-status.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { BusinessRoles } from 'src/auth/decorators/business-role.decorator';
import { BusinessRoleGuard } from 'src/auth/guards/business-role.guard';
import { BusinessContextGuard } from 'src/auth/guards/business-context.guard';
import { CurrentBusiness } from 'src/common/decorators/current-business.decorator';
import { QueryDebtDto } from './dto/query-debt.dto';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/auth.decorator';
import { BusinessProtected } from 'src/common/swagger/business.decorator';
import { DebtResponseDto } from './dto/debt-response.dto';
import { DebtStatus } from '@prisma/client';
import { PaginatedDebtResponseDto } from './dto/paginated-debt-response.dto';

@ApiTags('Debts')
@UseGuards(JwtAuthGuard, BusinessContextGuard, BusinessRoleGuard)
@ApiAuth()
@BusinessProtected()
@Controller()
export class DebtsController {
  constructor(private readonly debtsService: DebtsService) {}

  @BusinessRoles('ADMIN', 'OWNER', 'CASHIER')
  @Post('debts')
  @ApiOperation({ summary: 'Crear deuda' })
  @ApiResponse({
    status: 201,
    description: 'Deuda creada',
    type: DebtResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Deudor no encontrado' })
  @ApiResponse({
    status: 400,
    description: 'El deudor no pertenece al negocio',
  })
  create(
    @Body() dto: CreateDebtDto,
    @GetUser('id') userId: string,
    @CurrentBusiness('businessId') businessId: string,
  ) {
    return this.debtsService.create(dto, userId, businessId);
  }

  @Get('debts')
  @ApiOperation({ summary: 'Listar deudas del negocio' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'status', required: false, enum: DebtStatus })
  @ApiQuery({ name: 'overdue', required: false, type: Boolean })
  @ApiResponse({
    status: 200,
    description: 'Listado de deudas',
    type: PaginatedDebtResponseDto,
  })
  findByBusiness(
    @CurrentBusiness('businessId') businessId: string,
    @Query() query: QueryDebtDto,
  ) {
    return this.debtsService.findByBusiness(businessId, query);
  }

  @Get('debtors/:debtorId/debts')
  @ApiOperation({ summary: 'Listar deudas por deudor' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'status', required: false, enum: DebtStatus })
  @ApiQuery({ name: 'overdue', required: false, type: Boolean })
  @ApiResponse({
    status: 200,
    description: 'Listado de deudas del deudor',
    type: PaginatedDebtResponseDto,
  })
  findByDebtor(
    @Param('debtorId') debtorId: string,
    @Query() query: QueryDebtDto,
  ) {
    return this.debtsService.findByDebtor(debtorId, query);
  }

  @BusinessRoles('ADMIN', 'OWNER', 'CASHIER')
  @Patch('debts/:id/status')
  @ApiOperation({ summary: 'Actualizar estado de la deuda' })
  @ApiResponse({
    status: 200,
    description: 'Estado actualizado',
    type: DebtResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Deuda no encontrada' })
  @ApiResponse({ status: 400, description: 'Transición de estado inválida' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateDebtStatusDto) {
    return this.debtsService.updateStatus(id, dto);
  }
}
