import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from 'src/users/dto/user-response.dto';

export class TokenResponseDto {
  @ApiProperty({ type: UserResponseDto })
  user!: UserResponseDto;

  @ApiProperty()
  accessToken!: string;

  @ApiProperty({ example: '15m' })
  accessTokenExpiresIn!: string;

  @ApiProperty()
  refreshToken!: string;

  @ApiProperty({ example: '2026-05-01T00:00:00.000Z' })
  refreshTokenExpiresAt!: string;
}
