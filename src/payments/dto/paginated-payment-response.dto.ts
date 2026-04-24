import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from 'src/common/pagination/dto/pagination-meta.dto';
import { PaymentResponseDto } from './payment-response.dto';

export class PaginatedPaymentResponseDto {
  @ApiProperty({ type: [PaymentResponseDto] })
  data!: PaymentResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}
