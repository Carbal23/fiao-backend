import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
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

@UseGuards(JwtAuthGuard, BusinessContextGuard, BusinessRoleGuard)
@Controller('debtors')
export class DebtorsController {
  constructor(private readonly debtorsService: DebtorsService) {}

  @Post()
  @BusinessRoles('ADMIN', 'OWNER', 'CASHIER')
  create(
    @CurrentBusiness('businessId') businessId: string,
    @GetUser('id') currentUserId: string,
    @Body() data: CreateDebtorDto,
  ) {
    return this.debtorsService.create(businessId, currentUserId, data);
  }

  @Get()
  findAll(@CurrentBusiness('businessId') businessId: string) {
    return this.debtorsService.findAll(businessId);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentBusiness('businessId') businessId: string,
  ) {
    return this.debtorsService.findOne(id, businessId);
  }

  @Patch(':id')
  @BusinessRoles('ADMIN', 'OWNER')
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
  inactivate(
    @Param('id') id: string,
    @CurrentBusiness('businessId') businessId: string,
    @GetUser('id') currentUserId: string,
  ) {
    return this.debtorsService.inactivate(id, businessId, currentUserId);
  }
}
