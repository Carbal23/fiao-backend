import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class CreateGlobalPaymentDto {
  @IsUUID()
  @IsNotEmpty()
  debtorId!: string;

  @IsNumber()
  amount!: number;

  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @IsOptional()
  @IsString()
  note?: string;
}
