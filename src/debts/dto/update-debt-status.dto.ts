import { IsEnum } from 'class-validator';
import { DebtStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateDebtStatusDto {
  @ApiProperty({ example: 'PAID' })
  @IsEnum(DebtStatus)
  status!: DebtStatus;
}
