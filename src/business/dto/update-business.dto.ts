import { PartialType } from '@nestjs/mapped-types';
import { CreateBusinessDto } from './create-business.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateBusinessDto extends PartialType(CreateBusinessDto) {
  @ApiPropertyOptional({ example: 'Mi negocio', maxLength: 100 })
  name?: string;

  @ApiPropertyOptional({ example: 'Calle 123 #45-67', required: false })
  address?: string;

  @ApiPropertyOptional({ example: 'COP', required: false })
  currency?: string;
}
