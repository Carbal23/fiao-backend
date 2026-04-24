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
import {
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { LogoutDto } from './dto/logout.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Autenticación de usuario' })
  @ApiResponse({
    status: 201,
    description: 'Login exitoso',
    type: TokenResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciales inválidas',
  })
  async login(@Body() dto: LoginDto): Promise<TokenResponseDto> {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Renovar access token usando refresh token' })
  @ApiHeader({
    name: 'x-refresh-token',
    description: 'Refresh token',
    required: true,
  })
  @ApiHeader({
    name: 'x-device-info',
    description: 'Identificador del dispositivo',
    required: false,
  })
  @ApiResponse({
    status: 201,
    description: 'Token renovado',
    type: TokenResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token inválido o expirado',
  })
  async refresh(
    @Headers('x-refresh-token') refreshToken: string,
    @Headers('x-device-info') deviceInfo: string,
  ) {
    if (!refreshToken)
      throw new BadRequestException('Refresh token no enviado');
    return this.authService.refreshTokens(refreshToken, deviceInfo);
  }

  @Post('logout')
  @ApiOperation({
    summary: 'Cerrar sesión',
    description:
      'allDevices: boolean - Si es true, cierra sesión en todos los dispositivos, de lo contrario solo en el dispositivo actual.',
  })
  @ApiHeader({
    name: 'x-refresh-token',
    description: 'Refresh token',
  })
  @ApiResponse({
    status: 201,
    description: 'Logout realizado',
  })
  @ApiResponse({
    status: 400,
    description: 'Refresh token no enviado',
  })
  @ApiBody({
    type: LogoutDto,
    required: false,
  })
  async logout(
    @Headers('x-refresh-token') refreshToken: string,
    @Body()
    body?: LogoutDto,
  ) {
    return this.authService.logout(refreshToken, !!body?.allDevices);
  }
}
