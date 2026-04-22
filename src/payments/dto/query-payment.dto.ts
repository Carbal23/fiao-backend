import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';
import { IsOptional, IsEnum } from 'class-validator';
import { PaymentType } from '@prisma/client';

export class QueryPaymentDto extends PaginationDto {
  @IsOptional()
  @IsEnum(PaymentType)
  type?: PaymentType;

  @IsOptional()
  method?: string;

  @IsOptional()
  debtId?: string;
}
