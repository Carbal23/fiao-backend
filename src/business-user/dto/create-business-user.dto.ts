import { IsEnum, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { BusinessUserRole } from '@prisma/client';

export class CreateBusinessUserDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsEnum(BusinessUserRole)
  @IsOptional()
  role?: BusinessUserRole;
}
