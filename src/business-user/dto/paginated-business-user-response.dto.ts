import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from 'src/common/pagination/dto/pagination-meta.dto';
import { BusinessUserResponseDto } from './business-user-response.dto';

export class PaginatedBusinessUserResponseDto {
  @ApiProperty({ type: [BusinessUserResponseDto] })
  data!: BusinessUserResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}
