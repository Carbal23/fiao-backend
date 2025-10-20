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

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async validateCredentials(
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
      // Cast bcrypt.compare to a known function signature to avoid unsafe calls
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
    const payload = { sub: user.id, role: user.role };
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
    const { token, raw, reused } = await this.createOrReuseRefreshToken(
      user.id,
      dto.deviceInfo,
    );

    const refreshToken =
      raw ??
      this.findExistingRawToken(user.id, token.tokenHash, dto.deviceInfo);

    return {
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
  ) {
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
        return {
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

  // Logout: eliminar refresh token (o todos)
  async logout(
    userId: string,
    presentedRefreshToken?: string,
    allDevices = false,
  ) {
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

  // Helper para extraer user sin password
  async getUserSafeById(id: string): Promise<Omit<User, 'password'> | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) return null;
    const { password, ...rest } = user;
    return rest;
  }

  private findExistingRawToken(
    userId: string,
    hash: string,
    deviceInfo?: string,
  ) {
    // En producción, no se puede derivar el raw token del hash.
    // Esto se deja aquí solo para la estructura del DTO.
    return ''; // normalmente no devuelves el raw token si ya existía
  }
}
