import { IsNotEmpty, IsOptional, IsString, IsEnum } from 'class-validator';
import { DocumentType } from '@prisma/client';

export class CreateDebtorDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(DocumentType)
  documentType?: DocumentType;

  @IsOptional()
  @IsString()
  documentNumber?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
