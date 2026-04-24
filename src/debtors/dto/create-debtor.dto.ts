import { IsNotEmpty, IsOptional, IsString, IsEnum } from 'class-validator';
import { DocumentType } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDebtorDto {
  @ApiProperty({ example: 'Pedro Perez' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({ example: '+573008923910' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'CC' })
  @IsOptional()
  @IsEnum(DocumentType)
  documentType?: DocumentType;

  @ApiProperty({ example: '9129384' })
  @IsOptional()
  @IsString()
  documentNumber?: string;

  @ApiProperty({ example: 'Cliente nuevo' })
  @IsOptional()
  @IsString()
  notes?: string;
}
