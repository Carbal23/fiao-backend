import { ApiProperty } from '@nestjs/swagger';
import { DebtorResponseDto } from './debtor-response.dto';
import { PaginationMetaDto } from 'src/common/pagination/dto/pagination-meta.dto';

export class PaginatedDebtorResponseDto {
  @ApiProperty({ type: [DebtorResponseDto] })
  data!: DebtorResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}
