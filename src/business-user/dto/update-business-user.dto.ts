import { IsEnum, IsNotEmpty } from 'class-validator';
import { BusinessUserRole } from '@prisma/client';

export class UpdateBusinessUserDto {
  @IsEnum(BusinessUserRole)
  @IsNotEmpty()
  role: BusinessUserRole;
}
