import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BusinessUserService } from './business-user.service';
import { CreateBusinessUserDto } from './dto/create-business-user.dto';
import { UpdateBusinessUserDto } from './dto/update-business-user.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentBusiness } from 'src/common/decorators/current-business.decorator';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { BusinessRoles } from 'src/auth/decorators/business-role.decorator';
import { BusinessRoleGuard } from 'src/auth/guards/business-role.guard';
import { BusinessContextGuard } from 'src/auth/guards/business-context.guard';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';

@Controller('business-users')
@UseGuards(JwtAuthGuard, BusinessContextGuard, BusinessRoleGuard)
export class BusinessUserController {
  constructor(private readonly businessUserService: BusinessUserService) {}

  @Post()
  @BusinessRoles('ADMIN', 'OWNER')
  async addUser(
    @GetUser('id') addBy: string,
    @CurrentBusiness() businessId: string,
    @Body() dto: CreateBusinessUserDto,
  ) {
    return this.businessUserService.addUserToBusiness(businessId, dto, addBy);
  }

  @Get()
  @BusinessRoles('ADMIN', 'OWNER', 'CASHIER', 'VIEWER')
  async findAll(
    @CurrentBusiness() businessId: string,
    @Query() query: PaginationDto,
  ) {
    return this.businessUserService.getUsersByBusiness(businessId, query);
  }

  @Patch(':id')
  @BusinessRoles('ADMIN', 'OWNER')
  async updateRole(
    @CurrentBusiness() businessId: string,
    @Param('id') id: string,
    @Body() dto: UpdateBusinessUserDto,
    @GetUser('id') currentUserId: string,
  ) {
    return this.businessUserService.updateUserRole(
      businessId,
      id,
      dto,
      currentUserId,
    );
  }

  @Delete(':id')
  @BusinessRoles('OWNER')
  async removeUser(
    @CurrentBusiness() businessId: string,
    @Param('id') id: string,
    @GetUser('id') currentUserId: string,
  ) {
    return this.businessUserService.removeUserFromBusiness(
      businessId,
      id,
      currentUserId,
    );
  }
}
