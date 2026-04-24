import { ApiProperty } from '@nestjs/swagger';
import { DebtResponseDto } from './debt-response.dto';
import { PaginationMetaDto } from 'src/common/pagination/dto/pagination-meta.dto';

export class PaginatedDebtResponseDto {
  @ApiProperty({ type: [DebtResponseDto] })
  data!: DebtResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}
