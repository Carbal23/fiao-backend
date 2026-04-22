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

@UseGuards(JwtAuthGuard, BusinessContextGuard, BusinessRoleGuard)
@Controller()
export class DebtsController {
  constructor(private readonly debtsService: DebtsService) {}

  @BusinessRoles('ADMIN', 'OWNER', 'CASHIER')
  @Post('debts')
  create(
    @Body() dto: CreateDebtDto,
    @GetUser('id') userId: string,
    @CurrentBusiness('businessId') businessId: string,
  ) {
    return this.debtsService.create(dto, userId, businessId);
  }

  @Get('debts')
  findByBusiness(
    @CurrentBusiness('businessId') businessId: string,
    @Query() query: QueryDebtDto,
  ) {
    return this.debtsService.findByBusiness(businessId, query);
  }

  @Get('debtors/:debtorId/debts')
  findByDebtor(
    @Param('debtorId') debtorId: string,
    @Query() query: QueryDebtDto,
  ) {
    return this.debtsService.findByDebtor(debtorId, query);
  }

  @BusinessRoles('ADMIN', 'OWNER', 'CASHIER')
  @Patch('debts/:id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateDebtStatusDto) {
    return this.debtsService.updateStatus(id, dto);
  }
}
