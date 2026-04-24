import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod, PaymentType } from '@prisma/client';

export class PaymentResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ example: 50000 })
  amount!: number;

  @ApiProperty({ enum: PaymentMethod })
  method!: PaymentMethod;

  @ApiProperty({ enum: PaymentType })
  type!: PaymentType;

  @ApiProperty({ example: 'Nota del pago', required: false })
  note?: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  paymentDate!: Date;

  @ApiProperty()
  createdByUser!: {
    id: string;
    firstName: string;
    lastName: string;
  };
}
