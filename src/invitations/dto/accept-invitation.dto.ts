import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AcceptInvitationDto {
  @ApiProperty({ example: 'a1b2c3' })
  @IsString()
  code!: string;
}
