import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';
import { IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { DebtStatus } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryDebtDto extends PaginationDto {
  @ApiPropertyOptional({ enum: DebtStatus })
  @IsOptional()
  @IsEnum(DebtStatus)
  status?: DebtStatus;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  overdue?: boolean;
}
