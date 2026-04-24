import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Role, DocumentType } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'Juan' })
  @IsNotEmpty()
  @IsString()
  firstName!: string;

  @ApiProperty({ example: 'Pérez' })
  @IsNotEmpty()
  @IsString()
  lastName!: string;

  @ApiProperty({ enum: DocumentType, example: DocumentType.CC })
  @IsEnum(DocumentType)
  documentType!: DocumentType;

  @ApiProperty({ example: '1032876361' })
  @IsNotEmpty()
  @IsString()
  documentNumber!: string;

  @ApiProperty({ example: 'correo@email.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '3001234567', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsNotEmpty()
  @MinLength(6)
  password!: string;

  @ApiProperty({ enum: Role, example: Role.USER, required: false })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
