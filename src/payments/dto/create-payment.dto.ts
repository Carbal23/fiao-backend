import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { PaymentMethod, PaymentType } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaymentDto {
  @ApiProperty({ example: 'uuid-debt-id' })
  @IsUUID()
  @IsNotEmpty()
  debtId!: string;

  @ApiProperty({ example: 50000 })
  @IsNumber()
  amount!: number;

  @ApiProperty({ enum: PaymentMethod, example: 'CASH' })
  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @ApiProperty({ enum: PaymentType, example: 'PAYMENT' })
  @IsEnum(PaymentType)
  type!: PaymentType;

  @ApiPropertyOptional({ example: 'Pago parcial cliente frecuente' })
  @IsOptional()
  @IsString()
  note?: string;
}
