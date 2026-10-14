import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ example: 'password123' })
  @IsNotEmpty()
  @IsString()
  currentPassword!: string;

  @ApiProperty({ example: 'nuevaPassword456', minLength: 6 })
  @IsNotEmpty()
  @MinLength(6)
  newPassword!: string;
}
