import { ApiProperty } from '@nestjs/swagger';

class BusinessInDebtDto {
  @ApiProperty({ example: 'business-1' })
  id!: string;

  @ApiProperty({ example: 'Mi Negocio' })
  name!: string;

  @ApiProperty({ example: 'COP' })
  currency!: string;
}

class DebtorInDebtDto {
  @ApiProperty({ example: 'debtor-1' })
  id!: string;

  @ApiProperty({ example: 'Juan Pérez' })
  name!: string;

  @ApiProperty({ nullable: true, example: '555-1234' })
  phone!: string | null;
}

class CreatedByUserDto {
  @ApiProperty({ example: 'user-1' })
  id!: string;

  @ApiProperty({ example: 'John' })
  firstName!: string;

  @ApiProperty({ example: 'Doe' })
  lastName!: string;
}

export class DebtResponseDto {
  @ApiProperty({ example: 'debt-1' })
  id!: string;

  @ApiProperty({ example: 100000 })
  amount!: number;

  @ApiProperty({ example: 50000 })
  balance!: number;

  @ApiProperty({ example: 'COP' })
  currency!: string;

  @ApiProperty({ nullable: true, example: 'Descripción de la deuda' })
  description!: string | null;

  @ApiProperty({ example: 'OPEN' })
  status!: string;

  @ApiProperty({ nullable: true, example: '2023-12-31T23:59:59.000Z' })
  dueDate!: Date | null;

  @ApiProperty({ example: '2023-01-01T00:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2023-01-01T00:00:00.000Z' })
  updatedAt!: Date;

  @ApiProperty({ type: BusinessInDebtDto })
  business!: BusinessInDebtDto;

  @ApiProperty({ type: DebtorInDebtDto })
  debtor!: DebtorInDebtDto;

  @ApiProperty({ type: CreatedByUserDto })
  createdByUser!: CreatedByUserDto;
}
