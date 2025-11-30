import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { DebtsService } from './debts.service';
import { CreateDebtDto } from './dto/create-debt.dto';
import { UpdateDebtStatusDto } from './dto/update-debt-status.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { BusinessRoles } from 'src/auth/decorators/business-role.decorator';
import { BusinessRoleGuard } from 'src/auth/guards/business-role.guard';

@UseGuards(JwtAuthGuard, BusinessRoleGuard)
@Controller()
export class DebtsController {
  constructor(private readonly debtsService: DebtsService) {}

  @BusinessRoles('ADMIN', 'OWNER', 'CASHIER')
  @Post('debts')
  create(
    @Body() dto: CreateDebtDto,
    @GetUser('id') userId: string,
    @Headers('x-business-id') businessId: string,
  ) {
    return this.debtsService.create(dto, userId, businessId);
  }

  @Get('business/:businessId/debts')
  findByBusiness(@Param('businessId') businessId: string) {
    return this.debtsService.findByBusiness(businessId);
  }

  @Get('debtors/:debtorId/debts')
  findByDebtor(@Param('debtorId') debtorId: string) {
    return this.debtsService.findByDebtor(debtorId);
  }

  @BusinessRoles('ADMIN', 'OWNER', 'CASHIER')
  @Patch('debts/:id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateDebtStatusDto) {
    return this.debtsService.updateStatus(id, dto);
  }
}
