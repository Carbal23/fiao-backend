import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsNotEmpty()
  @IsString()
  identifier: string; // email | phone | documentNumber

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsString()
  deviceInfo?: string; // opcional para registrar refresh token por dispositivo
}
