import { ApiProperty } from '@nestjs/swagger';
import { DebtorResponseDto } from './debtor-response.dto';

/**
 * Totales agregados de un negocio. Existe para que el móvil no tenga que
 * descargar todos los deudores solo para sumar los saldos.
 */
export class DebtorSummaryResponseDto {
  @ApiProperty({
    example: 4850000,
    description: 'Suma de los saldos pendientes',
  })
  totalBalance!: number;

  @ApiProperty({ example: 349, description: 'Deudores activos del negocio' })
  totalDebtors!: number;

  @ApiProperty({ example: 137, description: 'Deudores con saldo pendiente' })
  debtorsWithDebt!: number;

  @ApiProperty({ example: 212, description: 'Deudores sin saldo pendiente' })
  debtorsClear!: number;

  @ApiProperty({
    type: [DebtorResponseDto],
    description: 'Deudores con mayor saldo, ordenados de mayor a menor',
  })
  topDebtors!: DebtorResponseDto[];
}
