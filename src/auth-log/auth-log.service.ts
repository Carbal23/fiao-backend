import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthLogParams } from './auth-log.types';

@Injectable()
export class AuthLogService {
  private readonly logger = new Logger(AuthLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(params: AuthLogParams): Promise<void> {
    const { event, userId, identifier, reason, deviceInfo, context } = params;

    try {
      await this.prisma.authLog.create({
        data: {
          event,
          userId: userId ?? null,
          identifier,
          reason,
          deviceInfo: deviceInfo ?? null,
          ipAddress: context?.ipAddress,
          userAgent: context?.userAgent,
        },
      });
    } catch (error) {
      this.logger.error(
        `No se pudo registrar el evento ${event}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
