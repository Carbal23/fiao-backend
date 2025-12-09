import { IsString, IsUUID } from 'class-validator';

export class AcceptInvitationDto {
  @IsUUID()
  userId: string;

  @IsString()
  code: string;
}
