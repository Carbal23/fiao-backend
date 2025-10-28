import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
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

@UseGuards(JwtAuthGuard, BusinessRoleGuard)
@Controller('business/:businessId/debtors')
export class DebtorsController {
  constructor(private readonly debtorsService: DebtorsService) {}

  @Post()
  @BusinessRoles('ADMIN', 'OWNER', 'CASHIER')
  create(
    @Param('businessId') businessId: string,
    @Body() data: CreateDebtorDto,
  ) {
    return this.debtorsService.create(businessId, data);
  }

  @Get()
  findAll(@Param('businessId') businessId: string) {
    return this.debtorsService.findAll(businessId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.debtorsService.findOne(id);
  }

  @Patch(':id')
  @BusinessRoles('ADMIN', 'OWNER')
  update(@Param('id') id: string, @Body() data: UpdateDebtorDto) {
    return this.debtorsService.update(id, data);
  }

  @Delete(':id')
  @BusinessRoles('ADMIN', 'OWNER')
  remove(@Param('id') id: string) {
    return this.debtorsService.remove(id);
  }
}
