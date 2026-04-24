import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { BusinessRoleGuard } from 'src/auth/guards/business-role.guard';
import { BusinessRoles } from 'src/auth/decorators/business-role.decorator';
import { BusinessContextGuard } from 'src/auth/guards/business-context.guard';
import { CurrentBusiness } from 'src/common/decorators/current-business.decorator';
import { CreateGlobalPaymentDto } from './dto/create-global-payment.dto';
import { QueryPaymentDto } from './dto/query-payment.dto';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/auth.decorator';
import { BusinessProtected } from 'src/common/swagger/business.decorator';
import { PaymentResponseDto } from './dto/payment-response.dto';
import { PaginatedPaymentResponseDto } from './dto/paginated-payment-response.dto';
import { PaymentMethod, PaymentType } from '@prisma/client';
import { GlobalPaymentResponseDto } from './dto/global-payment-response.dto';

@ApiTags('Payments')
@UseGuards(JwtAuthGuard, BusinessContextGuard, BusinessRoleGuard)
@ApiAuth()
@BusinessProtected()
@Controller()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @BusinessRoles('ADMIN', 'OWNER', 'CASHIER')
  @Post('payments')
  @ApiOperation({
    summary: 'Registrar pago sobre una deuda',
    description: `
      Tipos de movimiento:
      - PAYMENT: reduce saldo
      - ADJUSTMENT: aumenta o disminuye saldo (según monto positivo o negativo)
      - REVERSAL: revierte pagos previos

      Restricciones:
      - No se permiten operaciones sobre deudas CANCELLED
      - No se permiten pagos mayores al saldo
      `,
  })
  @ApiResponse({
    status: 201,
    description: 'Pago registrado correctamente',
    type: PaymentResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o deuda no válida',
  })
  @ApiResponse({ status: 404, description: 'Deuda no encontrada' })
  create(
    @Body() dto: CreatePaymentDto,
    @GetUser('id') userId: string,
    @CurrentBusiness('businessId') businessId: string,
  ) {
    return this.paymentsService.create(dto, userId, businessId);
  }

  @Post('payments/global')
  @BusinessRoles('ADMIN', 'OWNER', 'CASHIER')
  @ApiOperation({ summary: 'Pago global a múltiples deudas (FIFO)' })
  @ApiResponse({
    status: 201,
    description: 'Pago global aplicado',
    type: GlobalPaymentResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Monto inválido, sin deudas, o falta algun dato',
  })
  @ApiResponse({ status: 404, description: 'Deudor no encontrado' })
  createGlobalPayment(
    @Body() dto: CreateGlobalPaymentDto,
    @GetUser('id') userId: string,
    @CurrentBusiness() businessId: string,
  ) {
    return this.paymentsService.createGlobalPayment(dto, userId, businessId);
  }

  @Post('payments/global/reverse/:groupId')
  @BusinessRoles('ADMIN', 'OWNER')
  @ApiOperation({ summary: 'Reversar un pago global' })
  @ApiResponse({
    status: 200,
    description: 'Pago global reversado',
    schema: {
      example: {
        message: 'Pago global reversado correctamente',
        reversedCount: 3,
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Grupo no encontrado' })
  @ApiResponse({
    status: 400,
    description: 'No hay pagos a reversar, o ya fueron reversados',
  })
  reverse(
    @Param('groupId') groupId: string,
    @GetUser('id') userId: string,
    @CurrentBusiness('businessId') businessId: string,
  ) {
    return this.paymentsService.reversePaymentGroup(
      groupId,
      userId,
      businessId,
    );
  }

  @Get('payments')
  @ApiOperation({ summary: 'Listar pagos del negocio' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'type', required: false, enum: PaymentType })
  @ApiQuery({ name: 'method', required: false, enum: PaymentMethod })
  @ApiResponse({
    status: 200,
    description: 'Listado de pagos',
    type: PaginatedPaymentResponseDto,
  })
  findAll(
    @CurrentBusiness('businessId') businessId: string,
    @Query() query: QueryPaymentDto,
  ) {
    return this.paymentsService.findAll(businessId, query);
  }

  @Get('debts/:debtId/payments')
  @ApiOperation({ summary: 'Listar pagos de una deuda' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'type', required: false, enum: PaymentType })
  @ApiQuery({ name: 'method', required: false, enum: PaymentMethod })
  @ApiResponse({
    status: 200,
    description: 'Pagos de la deuda',
    type: [PaymentResponseDto],
  })
  findByDebt(@Param('debtId') debtId: string, @Query() query: QueryPaymentDto) {
    return this.paymentsService.findByDebt(debtId, query);
  }
}
