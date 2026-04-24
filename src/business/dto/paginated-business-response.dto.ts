import { ApiProperty } from '@nestjs/swagger';
import { BusinessDetailResponseDto } from './business-detail-response.dto';
import { PaginationMetaDto } from 'src/common/pagination/dto/pagination-meta.dto';

export class PaginatedBusinessResponseDto {
  @ApiProperty({ type: [BusinessDetailResponseDto] })
  data!: BusinessDetailResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}
