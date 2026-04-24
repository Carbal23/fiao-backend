import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateDebtDto } from './dto/create-debt.dto';
import { UpdateDebtStatusDto } from './dto/update-debt-status.dto';
import { debtSelect } from './debt.select';
import { DebtStatus, Prisma } from '@prisma/client';
import { AuditService } from 'src/audit/audit.service';
import { AuditAction } from 'src/audit/audit.types';
import { buildWhere } from 'src/common/pagination/utils/build-where.util';
import { paginate } from 'src/common/pagination/utils/paginate.util';
import { buildOrder } from 'src/common/pagination/utils/build-order.util';
import { QueryDebtDto } from './dto/query-debt.dto';
import { validTransitions } from './utils/stateValidTransitions';

@Injectable()
export class DebtsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(createDto: CreateDebtDto, userId: string, businessId: string) {
    const { debtorId, amount, description, dueDate } = createDto;

    const debtor = await this.prisma.debtor.findUnique({
      where: { id: debtorId },
    });
    if (!debtor) throw new NotFoundException('Deudor no encontrado');

    if (debtor.businessId !== businessId) {
      throw new BadRequestException('El deudor no pertenece al negocio');
    }

    const debt = await this.prisma.debt.create({
      data: {
        businessId,
        debtorId,
        amount: new Prisma.Decimal(amount),
        balance: new Prisma.Decimal(amount),
        description,
        dueDate,
        createdBy: userId,
      },
      select: debtSelect,
    });

    await this.auditService.log({
      userId,
      action: AuditAction.DEBT_CREATED,
      entity: 'Debt',
      entityId: debt.id,
      meta: {
        amount,
        debtorId,
        businessId,
      },
    });

    return debt;
  }

  async findByBusiness(businessId: string, query: QueryDebtDto) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy,
      order,
      status,
      overdue,
    } = query;

    const now = new Date();

    const where = buildWhere({
      search,
      searchFields: ['description'],
      filters: {
        businessId,
        ...(status && { status }),
        ...(overdue && {
          dueDate: { lt: now },
          status: { in: ['OPEN', 'PARTIAL'] },
        }),
      },
    });

    return paginate(
      this.prisma.debt,
      {
        where,
        orderBy: buildOrder(sortBy, order),
        select: debtSelect,
      },
      { page, limit },
    );
  }

  async findByDebtor(debtorId: string, query: QueryDebtDto) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy,
      order,
      status,
      overdue,
    } = query;

    const now = new Date();

    const where = buildWhere({
      search,
      searchFields: ['description'],
      filters: {
        debtorId,
        ...(status && { status }),
        ...(overdue && {
          dueDate: { lt: now },
          status: { in: ['OPEN', 'PARTIAL'] },
        }),
      },
    });

    return paginate(
      this.prisma.debt,
      {
        where,
        orderBy: buildOrder(sortBy, order),
        select: debtSelect,
      },
      { page, limit },
    );
  }

  async updateStatus(id: string, updateDto: UpdateDebtStatusDto) {
    const debt = await this.prisma.debt.findUnique({ where: { id } });
    if (!debt) throw new NotFoundException('Deuda no encontrada');

    if (!validTransitions[debt.status].includes(updateDto.status)) {
      throw new BadRequestException('Transición de estado inválida');
    }

    if (updateDto.status === DebtStatus.CANCELLED) {
      const hasPayments = await this.prisma.payment.count({
        where: { debtId: id },
      });

      if (hasPayments > 0) {
        throw new BadRequestException(
          'No puedes cancelar una deuda con pagos registrados',
        );
      }
    }

    const updated = await this.prisma.debt.update({
      where: { id },
      data: {
        status: updateDto.status,
      },
      select: debtSelect,
    });

    await this.auditService.log({
      userId: updated.createdByUser.id,
      action: AuditAction.DEBT_STATUS_CHANGED,
      entity: 'Debt',
      entityId: debt.id,
      meta: {
        previousStatus: debt.status,
        newStatus: updateDto.status,
      },
    });

    return updated;
  }
}
