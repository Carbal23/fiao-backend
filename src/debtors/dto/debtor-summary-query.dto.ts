import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class DebtorSummaryQueryDto {
  @ApiPropertyOptional({
    description: 'Cantidad de deudores a incluir en el ranking.',
    example: 5,
    default: 5,
    minimum: 0,
    maximum: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(50)
  top?: number;
}
