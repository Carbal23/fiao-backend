import { IsEnum, IsOptional, IsNumber } from 'class-validator';
import { DebtStatus } from '@prisma/client';

export class UpdateDebtStatusDto {
  @IsEnum(DebtStatus)
  status: DebtStatus;

  @IsOptional()
  @IsNumber()
  balance?: number; // opcional por si se requiere ajuste manual
}
