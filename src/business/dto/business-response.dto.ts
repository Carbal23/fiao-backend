import { ApiProperty } from '@nestjs/swagger';

export class BusinessResponseDto {
  @ApiProperty({ example: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Mi negocio' })
  name!: string;

  @ApiProperty({ example: 'Calle 123', required: false })
  address?: string;

  @ApiProperty({ example: 'COP' })
  currency!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty()
  inactivatedAt!: Date | null;

  @ApiProperty()
  ownerId!: string;
}
