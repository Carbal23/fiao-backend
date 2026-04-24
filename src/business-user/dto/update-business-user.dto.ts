import { IsEnum, IsNotEmpty } from 'class-validator';
import { BusinessUserRole } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateBusinessUserDto {
  @ApiPropertyOptional({
    enum: BusinessUserRole,
    example: BusinessUserRole.CASHIER,
  })
  @IsEnum(BusinessUserRole)
  @IsNotEmpty()
  role!: BusinessUserRole;
}
