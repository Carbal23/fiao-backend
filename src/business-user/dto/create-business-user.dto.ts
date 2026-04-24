import { IsEnum, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { BusinessUserRole } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBusinessUserDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID del usuario a agregar al negocio',
  })
  @IsUUID()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({
    example: 'ADMIN',
    description: 'Rol del usuario en el negocio',
  })
  @IsEnum(BusinessUserRole)
  @IsOptional()
  role?: BusinessUserRole;
}
