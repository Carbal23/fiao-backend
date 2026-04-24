import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsNumber,
} from 'class-validator';

export class CreateDebtDto {
  @ApiProperty({ example: 'debtor-1' })
  @IsUUID()
  @IsNotEmpty()
  debtorId!: string;

  @ApiProperty({ example: 100000 })
  @IsNumber()
  amount!: number;

  @ApiPropertyOptional({ example: 'Descripción de la deuda' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: '2023-12-31T23:59:59.000Z',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  dueDate?: Date;
}
