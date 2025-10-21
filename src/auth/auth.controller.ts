import {
  Controller,
  Post,
  Body,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { TokenResponseDto } from './dto/token-response.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto): Promise<TokenResponseDto> {
    return this.authService.login(dto);
  }

  @Post('refresh')
  async refresh(
    @Body() body: { userId: string },
    @Headers('x-refresh-token') refreshToken: string,
  ) {
    if (!refreshToken)
      throw new BadRequestException('Refresh token no enviado');
    return this.authService.refreshTokens(body.userId, refreshToken);
  }

  @Post('logout')
  async logout(
    @Body()
    body: {
      userId: string;
      refreshToken?: string;
      allDevices?: boolean;
    },
    @Headers('x-refresh-token') refreshToken?: string,
  ) {
    return this.authService.logout(
      body.userId,
      body.refreshToken ?? refreshToken,
      !!body.allDevices,
    );
  }
}
