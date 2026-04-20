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
import { GetUser } from 'src/common/decorators/get-user.decorator';

@UseGuards(JwtAuthGuard, BusinessRoleGuard)
@Controller('business/:businessId/debtors')
export class DebtorsController {
  constructor(private readonly debtorsService: DebtorsService) {}

  @Post()
  @BusinessRoles('ADMIN', 'OWNER', 'CASHIER')
  create(
    @Param('businessId') businessId: string,
    @GetUser('id') currentUserId: string,
    @Body() data: CreateDebtorDto,
  ) {
    return this.debtorsService.create(businessId, currentUserId, data);
  }

  @Get()
  findAll(@Param('businessId') businessId: string) {
    return this.debtorsService.findAll(businessId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Param('businessId') businessId: string) {
    return this.debtorsService.findOne(id, businessId);
  }

  @Patch(':id')
  @BusinessRoles('ADMIN', 'OWNER')
  update(
    @Param('id') id: string,
    @Param('businessId') businessId: string,
    @GetUser('id') currentUserId: string,
    @Body() data: UpdateDebtorDto,
  ) {
    return this.debtorsService.update(id, businessId, currentUserId, data);
  }

  @Delete(':id')
  @BusinessRoles('ADMIN', 'OWNER')
  remove(
    @Param('id') id: string,
    @Param('businessId') businessId: string,
    @GetUser('id') currentUserId: string,
  ) {
    return this.debtorsService.remove(id, businessId, currentUserId);
  }
}
