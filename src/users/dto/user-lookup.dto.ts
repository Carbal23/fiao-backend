import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UserLookupQueryDto {
  @ApiProperty({
    example: '3001234567',
    description: 'Correo, teléfono o número de documento exacto',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(254)
  identifier!: string;
}

export class UserLookupResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ example: 'Ana' })
  firstName!: string;

  @ApiProperty({ example: 'Gómez' })
  lastName!: string;
}
