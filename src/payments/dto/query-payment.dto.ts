import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';
import { IsOptional, IsEnum } from 'class-validator';
import { PaymentMethod, PaymentType } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryPaymentDto extends PaginationDto {
  @ApiPropertyOptional({ enum: PaymentType })
  @IsOptional()
  @IsEnum(PaymentType)
  type?: PaymentType;

  @ApiPropertyOptional({ enum: PaymentMethod })
  @IsOptional()
  method?: PaymentMethod;

  // @ApiPropertyOptional({ example: 'uuid-debt-id' })
  // @IsOptional()
  // debtId?: string;
}
