import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private readonly configService: ConfigService) {
    super({
      datasources: {
        db: {
          url:
            configService.get<string>('database.directUrl') ||
            configService.get<string>('database.url'),
        },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
    console.log('✅ Conectado a la base de datos.');
    console.log('🌍 NODE_ENV:', this.configService.get<string>('app.nodeEnv'));
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
