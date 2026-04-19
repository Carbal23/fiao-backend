import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsNumber,
} from 'class-validator';

export class CreateDebtDto {
  @IsUUID()
  @IsNotEmpty()
  debtorId!: string;

  @IsNumber()
  amount!: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  dueDate?: Date;
}
