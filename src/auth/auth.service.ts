import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { TokenResponseDto } from './dto/token-response.dto';
import { User } from '@prisma/client';
import { randomBytes } from 'crypto';
import { IJwtPayload } from './interfaces/jwt-payload.interface';
import { UserSafe, userSafeSelect } from 'src/users/user.select';
import { serializeUser } from 'src/users/helpers/user.serializer';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  private async validateCredentials(
    identifier: string,
    password: string,
  ): Promise<User | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { phone: identifier },
          { documentNumber: identifier },
        ],
        inactivatedAt: null,
      },
    });

    if (!user || !user.password) return null;

    let isMatch = false;
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const compareFn = bcrypt.compare as unknown as (
        a: string,
        b: string,
      ) => Promise<boolean>;
      isMatch = await compareFn(password, user.password);
    } catch {
      isMatch = false;
    }

    if (!isMatch) return null;

    return user;
  }

  private async signAccessToken(user: User) {
    const payload: IJwtPayload = {
      sub: user.id,
      documentNumber: user.documentNumber,
      role: user.role,
    };
    const token = await this.jwtService.signAsync(payload, {
      expiresIn: this.config.get<string>('jwt.expiresIn'),
    });
    return token;
  }

  private async createOrReuseRefreshToken(userId: string, deviceInfo?: string) {
    const days = parseInt(
      this.config.get<string>('jwt.refreshTokenExpiresDays') || '30',
      10,
    );
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    const existing = await this.prisma.refreshToken.findFirst({
      where: {
        userId,
        deviceInfo: deviceInfo ?? null,
        expiresAt: { gt: new Date() },
      },
    });

    if (existing) {
      return { token: existing, raw: null, reused: true };
    }

    // Generar uno nuevo
    const raw = randomBytes(64).toString('hex');
    const rounds = parseInt(
      this.config.get<string>('jwt.refreshTokenHashRounds') || '10',
      10,
    );
    const hash = await (
      bcrypt.hash as unknown as (
        data: string,
        rounds: number | string,
      ) => Promise<string>
    )(raw, rounds);

    const token = await this.prisma.refreshToken.create({
      data: { userId, tokenHash: hash, expiresAt, deviceInfo },
    });

    return { token, raw, reused: false };
  }

  async login(dto: LoginDto): Promise<TokenResponseDto> {
    const user = await this.validateCredentials(dto.identifier, dto.password);
    if (!user) throw new UnauthorizedException('Credenciales inválidas');

    const accessToken = await this.signAccessToken(user);
    const { token, raw } = await this.createOrReuseRefreshToken(
      user.id,
      dto.deviceInfo,
    );

    const refreshToken = raw ?? '';
    const safeUser = serializeUser(user);

    return {
      user: safeUser as UserSafe,
      accessToken,
      accessTokenExpiresIn: this.config.get<string>('jwt.expiresIn') || '15m',
      refreshToken,
      refreshTokenExpiresAt: token.expiresAt.toISOString(),
    };
  }

  async refreshTokens(
    userId: string,
    presentedRefreshToken: string,
    deviceInfo?: string,
  ): Promise<TokenResponseDto> {
    const dbTokens = await this.prisma.refreshToken.findMany({
      where: {
        userId,
        deviceInfo: deviceInfo ?? undefined,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!dbTokens.length) {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    for (const dbToken of dbTokens) {
      const compareFn = bcrypt.compare as unknown as (
        a: string,
        b: string,
      ) => Promise<boolean>;
      const isMatch = await compareFn(presentedRefreshToken, dbToken.tokenHash);
      if (isMatch) {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
        });
        if (!user) throw new UnauthorizedException('Usuario no encontrado');

        const newAccessToken = await this.signAccessToken(user);
        const safeUser = serializeUser(user);

        return {
          user: safeUser as UserSafe,
          accessToken: newAccessToken,
          accessTokenExpiresIn:
            this.config.get<string>('jwt.expiresIn') || '15m',
          refreshToken: presentedRefreshToken,
          refreshTokenExpiresAt: dbToken.expiresAt.toISOString(),
        };
      }
    }

    throw new UnauthorizedException('Refresh token inválido o expirado');
  }

  async logout(
    userId: string,
    presentedRefreshToken?: string,
    allDevices = false,
  ): Promise<{ message: string }> {
    if (allDevices) {
      await this.prisma.refreshToken.deleteMany({ where: { userId } });
      return { message: 'Sesiones cerradas en todos los dispositivos' };
    }

    if (presentedRefreshToken) {
      const tokens = await this.prisma.refreshToken.findMany({
        where: { userId },
      });
      for (const dbToken of tokens) {
        const compareFn = bcrypt.compare as unknown as (
          a: string,
          b: string,
        ) => Promise<boolean>;
        const isMatch = await compareFn(
          presentedRefreshToken,
          dbToken.tokenHash,
        );
        if (isMatch) {
          await this.prisma.refreshToken.delete({ where: { id: dbToken.id } });
          return { message: 'Logout realizado' };
        }
      }
    }
    return { message: 'Logout realizado (token no encontrado o ya eliminado)' };
  }

  async getUserSafeById(id: string): Promise<UserSafe | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: userSafeSelect,
    });
    if (!user) return null;

    return user;
  }
}
