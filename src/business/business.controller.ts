import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
} from '@nestjs/common';
import { BusinessService } from './business.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { BusinessRoleGuard } from 'src/auth/guards/business-role.guard';
import { BusinessRoles } from 'src/auth/decorators/business-role.decorator';

@Controller('business')
@UseGuards(JwtAuthGuard)
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Post()
  create(@Body() dto: CreateBusinessDto, @GetUser('id') userId: string) {
    return this.businessService.create(dto, userId);
  }

  @Get()
  findAll(@GetUser('id') userId: string) {
    return this.businessService.findAllByUser(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.businessService.findOne(id, userId);
  }

  @Patch(':id')
  @UseGuards(BusinessRoleGuard)
  @BusinessRoles('OWNER', 'ADMIN')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateBusinessDto,
    @GetUser('id') userId: string,
  ) {
    return this.businessService.update(id, dto, userId);
  }
}
