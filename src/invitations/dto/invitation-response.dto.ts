import { ApiProperty } from '@nestjs/swagger';
import {
  BusinessUserRole,
  InvitationStatus,
  InvitationType,
} from '@prisma/client';

export class DebtorInInvitationDto {
  @ApiProperty({ example: 'uuid-debtor-id' })
  id!: string;

  @ApiProperty({ example: 'Juan Pérez' })
  name!: string;

  @ApiProperty({ example: '+573001234567' })
  phone!: string;
}

export class InvitationResponseDto {
  @ApiProperty({ example: 'uuid-invitation-id' })
  id!: string;

  @ApiProperty({ example: 'ABC123' })
  code!: string;

  @ApiProperty({ example: 'juan.perez@example.com' })
  email!: string;

  @ApiProperty({ example: '+573001234567' })
  phone!: string;

  @ApiProperty({ enum: InvitationType })
  type!: string;

  @ApiProperty({ enum: BusinessUserRole, required: false })
  role!: string;

  @ApiProperty({ enum: InvitationStatus })
  status!: string;

  @ApiProperty({ example: 'uuid-business-id' })
  businessId!: string;

  @ApiProperty({ example: 'uuid-debtor-id' })
  debtorId?: string;

  @ApiProperty()
  expiresAt!: Date;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty({ type: DebtorInInvitationDto })
  debtor!: DebtorInInvitationDto;
}

export class CreateInvitationResponseDto {
  @ApiProperty({ example: 'Invitación creada' })
  message!: string;

  @ApiProperty({ type: InvitationResponseDto })
  invitation!: InvitationResponseDto;
}
