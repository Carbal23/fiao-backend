import { ApiProperty } from '@nestjs/swagger';

export class BusinessSummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ required: false, nullable: true })
  address?: string | null;

  @ApiProperty()
  currency!: string;

  @ApiProperty({ required: false })
  createdAt?: Date;
}

export class WorkingBusinessDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  role!: string;

  @ApiProperty({ type: BusinessSummaryDto })
  business!: BusinessSummaryDto;
}

export class ClientBusinessDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ required: false, nullable: true })
  phone?: string | null;

  @ApiProperty({ type: BusinessSummaryDto })
  business!: BusinessSummaryDto;
}

export class UserDashboardDto {
  @ApiProperty({ type: [BusinessSummaryDto] })
  ownedBusinesses!: BusinessSummaryDto[];

  @ApiProperty({ type: [WorkingBusinessDto] })
  workingBusinesses!: WorkingBusinessDto[];

  @ApiProperty({ type: [ClientBusinessDto] })
  clientBusinesses!: ClientBusinessDto[];
}
