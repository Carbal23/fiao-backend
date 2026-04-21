import { Controller, Post, Body, UseGuards, Get, Param } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { BusinessRoleGuard } from 'src/auth/guards/business-role.guard';
import { BusinessRoles } from 'src/auth/decorators/business-role.decorator';
import { BusinessContextGuard } from 'src/auth/guards/business-context.guard';
import { CurrentBusiness } from 'src/common/decorators/current-business.decorator';

@UseGuards(JwtAuthGuard, BusinessContextGuard, BusinessRoleGuard)
@Controller()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @BusinessRoles('ADMIN', 'OWNER', 'CASHIER')
  @Post('payments')
  create(
    @Body() dto: CreatePaymentDto,
    @GetUser('id') userId: string,
    @CurrentBusiness('businessId') businessId: string,
  ) {
    return this.paymentsService.create(dto, userId, businessId);
  }

  @Get('debts/:debtId/payments')
  findByDebt(@Param('debtId') debtId: string) {
    return this.paymentsService.findByDebt(debtId);
  }
}
