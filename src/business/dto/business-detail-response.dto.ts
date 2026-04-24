import { ApiProperty } from '@nestjs/swagger';
import { BusinessResponseDto } from './business-response.dto';
import { BusinessUserResponseDto } from 'src/business-user/dto/business-user-response.dto';

export class BusinessDetailResponseDto extends BusinessResponseDto {
  @ApiProperty({ type: [BusinessUserResponseDto] })
  businessUsers!: BusinessUserResponseDto[];
}
