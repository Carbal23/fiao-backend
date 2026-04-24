import { ApiProperty } from '@nestjs/swagger';

export class DebtorResponseDto {
  @ApiProperty({ description: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Miguel', description: 'Nombre del deudor' })
  name!: string;

  @ApiProperty({
    example: '+573049582930',
    description: 'Numero celular del deudor',
    required: false,
  })
  phone?: string;

  @ApiProperty({ example: 'CC', required: false })
  documentType?: string;

  @ApiProperty({ example: '1045389402', required: false })
  documentNumber?: string;

  @ApiProperty({ example: 'Cliente nuevo', required: false })
  notes?: string;

  @ApiProperty({ description: 'uuid del negocio' })
  businessId!: string;

  @ApiProperty({ nullable: true })
  userId!: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty({
    description: 'Fecha de inactivacion del deudor',
    nullable: true,
  })
  inactivatedAt!: Date | null;
}
