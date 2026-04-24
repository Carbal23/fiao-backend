import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsBoolean } from 'class-validator';

export class LogoutDto {
  @ApiPropertyOptional({
    description: 'Si es true, cierra sesión en todos los dispositivos',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  allDevices?: boolean;
}
