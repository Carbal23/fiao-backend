/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditAction } from './audit.types';

interface LogParams {
  userId?: string;
  action: AuditAction;
  entity: string;
  entityId?: string;
  meta?: any;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: LogParams) {
    try {
      const { userId, action, entity, entityId, meta } = params;

      await this.prisma.auditLog.create({
        data: {
          userId,
          action,
          entity,
          entityId,
          meta,
        },
      });
    } catch (error) {
      console.error('Audit log failed:', error);
    }
  }
}
