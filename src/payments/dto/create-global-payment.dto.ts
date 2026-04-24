import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { PaymentMethod } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGlobalPaymentDto {
  @ApiProperty({ example: 'uuid-debtor-id' })
  @IsUUID()
  @IsNotEmpty()
  debtorId!: string;

  @ApiProperty({ example: 50000 })
  @IsNumber()
  amount!: number;

  @ApiProperty({ enum: PaymentMethod, example: 'TRANSFER' })
  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @ApiPropertyOptional({ example: 'Pago global del cliente' })
  @IsOptional()
  @IsString()
  note?: string;
}
