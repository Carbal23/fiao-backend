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
  update(
    @Param('id') id: string,
    @Body() dto: UpdateBusinessDto,
    @GetUser('id') userId: string,
  ) {
    return this.businessService.update(id, dto, userId);
  }
}
