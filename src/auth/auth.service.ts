import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { TokenResponseDto } from './dto/token-response.dto';
import { AuthLogEvent, RefreshToken, User } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';
import type { IJwtPayload } from './interfaces/jwt-payload.interface';
import { UserSafe, userSafeSelect } from 'src/users/user.select';
import { serializeUser } from 'src/users/helpers/user.serializer';
import { AuthLogService } from 'src/auth-log/auth-log.service';
import { AuthLogReason, RequestContext } from 'src/auth-log/auth-log.types';
import type { CredentialsCheck } from './interfaces/credentials-check.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly authLog: AuthLogService,
  ) {}

  private async validateCredentials(
    identifier: string,
    password: string,
  ): Promise<CredentialsCheck> {
    const candidates = await this.prisma.user.findMany({
      where: {
        OR: [
          { email: identifier },
          { phone: identifier },
          { documentNumber: identifier },
        ],
        inactivatedAt: null,
      },
      take: 2,
    });

    const matches: User[] = [];
    for (const candidate of candidates) {
      if (
        candidate.password &&
        (await bcrypt.compare(password, candidate.password))
      ) {
        matches.push(candidate);
      }
    }

    return {
      user: matches.length === 1 ? matches[0] : null,
      attemptedUserId: candidates.length === 1 ? candidates[0].id : null,
      ambiguous: matches.length > 1,
    };
  }

  private get accessTokenExpiresIn(): string {
    return this.config.getOrThrow<string>('jwt.expiresIn');
  }

  private signAccessToken(user: User) {
    const payload: IJwtPayload = { sub: user.id, role: user.role };
    return this.jwtService.signAsync(payload);
  }

  private hashToken(rawToken: string) {
    return createHash('sha256').update(rawToken).digest('hex');
  }

  private parseRefreshToken(presentedRefreshToken: string) {
    const separator = presentedRefreshToken.indexOf('.');
    const userId = presentedRefreshToken.slice(0, separator);
    const rawToken = presentedRefreshToken.slice(separator + 1);

    if (separator <= 0 || !rawToken) {
      throw new UnauthorizedException('Token inválido');
    }

    return { userId, rawToken };
  }

  private async findValidRefreshToken(
    presentedRefreshToken: string,
    deviceInfo?: string,
  ): Promise<RefreshToken | null> {
    const { userId, rawToken } = this.parseRefreshToken(presentedRefreshToken);

    const token = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hashToken(rawToken) },
    });

    if (!token || token.userId !== userId) return null;
    if (token.expiresAt <= new Date()) return null;
    if (deviceInfo !== undefined && token.deviceInfo !== deviceInfo) {
      return null;
    }

    return token;
  }

  private async createRefreshToken(userId: string, deviceInfo?: string) {
    const days = this.config.getOrThrow<number>('jwt.refreshTokenExpiresDays');
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.deleteMany({
      where: {
        userId,
        OR: [
          { deviceInfo: deviceInfo ?? null },
          { expiresAt: { lte: new Date() } },
        ],
      },
    });

    const rawToken = randomBytes(64).toString('hex');

    const token = await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: this.hashToken(rawToken),
        expiresAt,
        deviceInfo,
      },
    });

    return { token, refreshToken: `${userId}.${rawToken}` };
  }

  async login(
    dto: LoginDto,
    context?: RequestContext,
  ): Promise<TokenResponseDto> {
    const { user, attemptedUserId, ambiguous } = await this.validateCredentials(
      dto.identifier,
      dto.password,
    );

    if (!user) {
      await this.authLog.record({
        event: AuthLogEvent.LOGIN_FAILED,
        userId: attemptedUserId,
        identifier: dto.identifier,
        reason: ambiguous
          ? AuthLogReason.AMBIGUOUS_IDENTIFIER
          : AuthLogReason.INVALID_CREDENTIALS,
        deviceInfo: dto.deviceInfo,
        context,
      });

      if (ambiguous) {
        throw new UnauthorizedException(
          'Este dato corresponde a más de una cuenta. Inicia sesión con otro dato (correo, teléfono o documento).',
        );
      }
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const accessToken = await this.signAccessToken(user);
    const { token, refreshToken } = await this.createRefreshToken(
      user.id,
      dto.deviceInfo,
    );

    await this.authLog.record({
      event: AuthLogEvent.LOGIN_SUCCESS,
      userId: user.id,
      deviceInfo: dto.deviceInfo,
      context,
    });

    return {
      user: serializeUser(user) as UserSafe,
      accessToken,
      accessTokenExpiresIn: this.accessTokenExpiresIn,
      refreshToken,
      refreshTokenExpiresAt: token.expiresAt.toISOString(),
    };
  }

  async refreshTokens(
    presentedRefreshToken: string,
    deviceInfo?: string,
  ): Promise<TokenResponseDto> {
    const token = await this.findValidRefreshToken(
      presentedRefreshToken,
      deviceInfo,
    );
    if (!token) {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    const user = await this.prisma.user.findFirst({
      where: { id: token.userId, inactivatedAt: null },
    });
    if (!user) throw new UnauthorizedException('Usuario no encontrado');

    return {
      user: serializeUser(user) as UserSafe,
      accessToken: await this.signAccessToken(user),
      accessTokenExpiresIn: this.accessTokenExpiresIn,
      refreshToken: presentedRefreshToken,
      refreshTokenExpiresAt: token.expiresAt.toISOString(),
    };
  }

  async logout(
    presentedRefreshToken: string,
    allDevices = false,
    context?: RequestContext,
  ): Promise<{ message: string }> {
    if (!presentedRefreshToken) {
      throw new BadRequestException('Refresh token no enviado');
    }

    const token = await this.findValidRefreshToken(presentedRefreshToken);

    if (allDevices) {
      if (!token) {
        throw new UnauthorizedException('Refresh token inválido o expirado');
      }
      await this.prisma.refreshToken.deleteMany({
        where: { userId: token.userId },
      });
      await this.authLog.record({
        event: AuthLogEvent.LOGOUT_ALL_DEVICES,
        userId: token.userId,
        deviceInfo: token.deviceInfo,
        context,
      });
      return { message: 'Sesiones cerradas en todos los dispositivos' };
    }

    if (!token) {
      return {
        message: 'Logout realizado (token no encontrado o ya eliminado)',
      };
    }

    await this.prisma.refreshToken.delete({ where: { id: token.id } });
    await this.authLog.record({
      event: AuthLogEvent.LOGOUT,
      userId: token.userId,
      deviceInfo: token.deviceInfo,
      context,
    });
    return { message: 'Logout realizado' };
  }

  async getUserSafeById(id: string): Promise<UserSafe | null> {
    const user = await this.prisma.user.findFirst({
      where: { id, inactivatedAt: null },
      select: userSafeSelect,
    });
    if (!user) return null;

    return user;
  }
}
