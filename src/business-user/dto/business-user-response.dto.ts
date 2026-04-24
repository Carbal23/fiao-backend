import { ApiProperty } from '@nestjs/swagger';

export class UserInBusinessDto {
  @ApiProperty({ example: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Juan' })
  firstName!: string;

  @ApiProperty({ example: 'Pérez' })
  lastName!: string;

  @ApiProperty({ example: 'juan@email.com' })
  email!: string;

  @ApiProperty({ example: '+573001234567', required: false })
  phone!: string;
}

export class BusinessUserResponseDto {
  @ApiProperty({ example: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'uuid' })
  businessId!: string;

  @ApiProperty({ example: 'uuid' })
  userId!: string;

  @ApiProperty({ example: 'ADMIN' })
  role!: string;

  @ApiProperty({ type: UserInBusinessDto })
  user!: UserInBusinessDto;

  @ApiProperty()
  createdAt!: Date;
}
