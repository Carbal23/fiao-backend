import { ApiProperty } from '@nestjs/swagger';
import { DebtStatus } from '@prisma/client';

class PaymentGroupResponseDto {
  @ApiProperty({ example: 'uuid' })
  id!: string;

  @ApiProperty({ example: 100000 })
  totalAmount!: number;
}

class PaymentDebtorInfoResponseDto {
  @ApiProperty({ example: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Maria Alejandra' })
  name!: string;
}

class PaymentSummaryResponseDto {
  @ApiProperty({ example: '100000' })
  totalApplied!: number;

  @ApiProperty({ example: 3 })
  debtsAffected!: number;
}

class PaymentsResponseDto {
  @ApiProperty({ example: 'uuid' })
  paymentId!: string;

  @ApiProperty({ example: 'uuid' })
  debtId!: string;

  @ApiProperty({ example: 50000 })
  appliedAmount!: number;

  @ApiProperty({ example: 100000 })
  previousBalance!: number;

  @ApiProperty({ example: 50000 })
  newBalance: number | undefined;

  @ApiProperty({ example: 'OPEN' })
  status: DebtStatus | undefined;
}

export class GlobalPaymentResponseDto {
  @ApiProperty()
  message!: string;

  @ApiProperty({ type: PaymentGroupResponseDto })
  group!: PaymentGroupResponseDto;

  @ApiProperty()
  debtor!: PaymentDebtorInfoResponseDto;

  @ApiProperty({ type: PaymentSummaryResponseDto })
  summary!: PaymentSummaryResponseDto;

  @ApiProperty({ type: PaymentsResponseDto, isArray: true })
  payments!: PaymentsResponseDto;
}
