export class BusinessSummaryDto {
  id: string;
  name: string;
  address?: string | null;
  currency: string;
  createdAt?: Date;
}

export class WorkingBusinessDto {
  id: string;
  role: string;
  business: BusinessSummaryDto;
}

export class ClientBusinessDto {
  id: string;
  name: string;
  phone?: string | null;
  business: BusinessSummaryDto;
}

export class UserDashboardDto {
  ownedBusinesses: BusinessSummaryDto[];
  workingBusinesses: WorkingBusinessDto[];
  clientBusinesses: ClientBusinessDto[];
}
