import {
  IsEmail,
  IsOptional,
  IsUUID,
  IsPhoneNumber,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { InvitationType, BusinessUserRole } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInvitationDto {
  @ApiPropertyOptional({ example: 'uuid-debtor-id', required: false })
  @IsOptional()
  @IsUUID()
  debtorId?: string;

  @ApiPropertyOptional({ example: 'user@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+573001234567' })
  @IsOptional()
  @IsPhoneNumber('CO')
  phone?: string;

  @ApiProperty({
    enum: InvitationType,
    example: 'DEBTOR',
    description: `
      Tipos:
      - DEBTOR: vincula usuario a un deudor existente
      - BUSINESS_USER: invita usuario al negocio
          `,
  })
  @IsEnum(InvitationType)
  type!: InvitationType;

  @ApiPropertyOptional({
    enum: BusinessUserRole,
    example: 'CASHIER',
    description: 'Requerido si type = BUSINESS_USER',
  })
  @IsOptional()
  @IsEnum(BusinessUserRole)
  role?: BusinessUserRole;

  @ApiPropertyOptional({
    example: '2026-05-01T00:00:00.000Z',
    description: 'Fecha de expiración (por defecto 7 días)',
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
