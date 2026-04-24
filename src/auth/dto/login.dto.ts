import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: '12345678',
    description: 'Puede ser email, teléfono o número de documento',
  })
  @IsNotEmpty()
  @IsString()
  identifier!: string;

  @ApiProperty({
    example: 'password123',
  })
  @IsNotEmpty()
  @IsString()
  password!: string;

  @ApiProperty({
    example: 'androiod 11',
    required: false,
    description: 'Identificador del dispositivo',
  })
  @IsOptional()
  @IsString()
  deviceInfo?: string;
}
