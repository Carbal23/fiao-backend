import {
  IsEmail,
  IsOptional,
  IsUUID,
  IsPhoneNumber,
  IsDateString,
} from 'class-validator';

export class CreateInvitationDto {
  @IsUUID()
  businessId: string;

  @IsOptional()
  @IsUUID()
  debtorId?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsPhoneNumber('CO')
  phone?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
