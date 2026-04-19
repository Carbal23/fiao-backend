import {
  IsEmail,
  IsOptional,
  IsUUID,
  IsPhoneNumber,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { InvitationType, BusinessUserRole } from '@prisma/client';

export class CreateInvitationDto {
  @IsOptional()
  @IsUUID()
  debtorId?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsPhoneNumber('CO')
  phone?: string;

  @IsEnum(InvitationType)
  type: InvitationType;

  @IsOptional()
  @IsEnum(BusinessUserRole)
  role?: BusinessUserRole;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
