import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from 'src/common/pagination/dto/pagination-meta.dto';
import { InvitationResponseDto } from './invitation-response.dto';

export class PaginatedInvitationResponseDto {
  @ApiProperty({ type: [InvitationResponseDto] })
  data!: InvitationResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}
