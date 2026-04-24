import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from 'src/users/dto/user-response.dto';
import { DebtorResponseDto } from './debtor-response.dto';
class BusinessBasicDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;
}

export class DebtorDetailResponseDto extends DebtorResponseDto {
  @ApiProperty({ type: BusinessBasicDto })
  business!: BusinessBasicDto;

  @ApiProperty({ type: UserResponseDto, nullable: true })
  user!: UserResponseDto | null;

  @ApiProperty({ type: [Object] })
  debts!: any[];
}
