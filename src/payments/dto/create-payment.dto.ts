import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { PaymentMethod, PaymentType } from '@prisma/client';

export class CreatePaymentDto {
  @IsUUID()
  @IsNotEmpty()
  debtId: string;

  @IsNumber()
  amount: number;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsEnum(PaymentType)
  type: PaymentType;

  @IsOptional()
  @IsString()
  note?: string;
}
