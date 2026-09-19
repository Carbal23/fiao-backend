import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateDebtorDto } from './dto/create-debtor.dto';
import { UpdateDebtorDto } from './dto/update-debtor.dto';
import { DebtStatus, Debtor, Prisma } from '@prisma/client';
import { userSafeSelect } from 'src/users/user.select';
import { AuditService } from 'src/audit/audit.service';
import { AuditAction } from 'src/audit/audit.types';
import { DebtorQueryDto } from './dto/debtor-query.dto';
import { paginate } from 'src/common/pagination/utils/paginate.util';
import { buildOrder } from 'src/common/pagination/utils/build-order.util';

/**
 * Quita tildes y pasa a minúsculas, para que "José" y "jose" se encuentren.
 *
 * Tiene que producir exactamente lo mismo que el `translate(lower(...))` de la
 * migración `add_debtor_search_text`, o las filas viejas y las nuevas quedarían
 * normalizadas de forma distinta y la búsqueda sería incoherente.
 */
const normalizeSearch = (value: string): string =>
  value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/** Texto indexable de un deudor: lo que el tendero puede teclear para hallarlo. */
const buildSearchText = (fields: {
  name?: string | null;
  phone?: string | null;
  documentNumber?: string | null;
}): string =>
  normalizeSearch(
    [fields.name, fields.phone, fields.documentNumber]
      .filter((part): part is string => Boolean(part))
      .join(' '),
  );

/**
 * Filtros de listado de deudores.
 *
 * No se usa el `buildWhere` común porque este módulo necesita dos cosas que
 * aquel no sabe hacer: buscar sobre `searchText` (una sola columna ya
 * normalizada, en vez de tres `OR` sensibles a tildes) y filtrar por si el
 * deudor tiene saldo o no.
 */
const buildDebtorWhere = (
  base: Prisma.DebtorWhereInput,
  search?: string,
  hasDebt?: boolean,
): Prisma.DebtorWhereInput => {
  const where: Prisma.DebtorWhereInput = { ...base, inactivatedAt: null };

  const term = search ? normalizeSearch(search) : '';
  if (term.length > 0) {
    where.searchText = { contains: term };
  }

  if (hasDebt !== undefined) {
    const withBalance = {
      some: {
        status: { in: [DebtStatus.OPEN, DebtStatus.PARTIAL] },
        balance: { gt: 0 },
      },
    };
    // `none` es la negación exacta de `some`: sin deuda abierta con saldo.
    where.debts = hasDebt ? withBalance : { none: withBalance.some };
  }

  return where;
};

@Injectable()
export class DebtorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(
    businessId: string,
    currentUserId: string,
    data: CreateDebtorDto,
  ): Promise<Debtor> {
    // Buscar si ya existe un user con los datos del deudor
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { documentNumber: data.documentNumber ?? undefined },
          { phone: data.phone ?? undefined },
        ],
      },
    });

    // Validar duplicado dentro del mismo negocio
    const existingDebtor = await this.prisma.debtor.findFirst({
      where: {
        businessId,
        OR: [
          { documentNumber: data.documentNumber ?? undefined },
          { phone: data.phone ?? undefined },
        ],
      },
    });

    if (existingDebtor) {
      throw new BadRequestException(
        'Ya existe un deudor con estos datos en este negocio.',
      );
    }

    const debtor = await this.prisma.debtor.create({
      data: {
        ...data,
        businessId,
        userId: existingUser?.id ?? null,
        searchText: buildSearchText(data),
      },
    });

    await this.auditService.log({
      userId: currentUserId,
      action: AuditAction.DEBTOR_CREATED,
      entity: 'Debtor',
      entityId: debtor.id,
      meta: {
        debtorId: debtor.id,
        name: data.name,
        documentNumber: data.documentNumber,
        phone: data.phone,
        businessId,
      },
    });

    return debtor;
  }

  async findAll(businessId: string, query: DebtorQueryDto) {
    const { page = 1, limit = 10, search, sortBy, order, hasDebt } = query;

    const where = buildDebtorWhere({ businessId }, search, hasDebt);

    const result = await paginate(
      this.prisma.debtor,
      {
        where,
        include: {
          user: { select: userSafeSelect },
          debts: {
            where: {
              status: {
                in: ['OPEN', 'PARTIAL'],
              },
            },
            select: {
              balance: true,
            },
          },
        },
        orderBy: buildOrder(sortBy, order),
      },
      { page, limit },
    );

    const data = result.data as Array<
      Debtor & {
        debts: { balance: Prisma.Decimal }[];
      }
    >;

    return {
      ...result,
      data: data.map(({ debts, ...debtor }) => {
        const totalBalance = debts.reduce(
          (acc, debt) => acc + debt.balance.toNumber(),
          0,
        );

        return {
          ...debtor,
          totalBalance,
          hasPendingDebt: totalBalance > 0,
        };
      }),
    };
  }

  /**
   * Totales del negocio, agregados en la base de datos.
   *
   * El móvil los calculaba sumando la primera página de deudores, así que a
   * partir de 100 clientes el "total por cobrar" de la pantalla de inicio se
   * quedaba corto sin avisar. `limit` está topado en 100 en el PaginationDto,
   * de modo que no se arreglaba pidiendo más: el total tiene que calcularlo
   * quien tiene todas las filas.
   *
   * Se consideran deudas OPEN y PARTIAL, igual que `findAll`, y se excluyen
   * los deudores inactivados.
   */
  async getSummary(businessId: string, top = 5) {
    const openDebts = {
      status: { in: [DebtStatus.OPEN, DebtStatus.PARTIAL] },
    };
    const scope = { businessId, ...openDebts, debtor: { inactivatedAt: null } };

    /**
     * El ranking se ordena por la suma de saldos en la base de datos. Si se
     * ordenara en el móvil sobre una página, un moroso antiguo que no cabe en
     * esa página nunca saldría en la lista.
     *
     * Con `top = 0` quien llama solo quiere los totales (la lista de clientes
     * lo usa para los contadores de sus chips), así que se ahorra la
     * agrupación entera. El tipo va explícito porque el ternario, dentro del
     * `Promise.all`, degradaba la tupla a `any`.
     */
    type RankingEntry = {
      debtorId: string;
      _sum: { balance: Prisma.Decimal | null };
    };

    const rankingQuery =
      top > 0
        ? this.prisma.debt.groupBy({
            by: ['debtorId'],
            where: scope,
            _sum: { balance: true },
            orderBy: { _sum: { balance: 'desc' } },
            take: top,
          })
        : Promise.resolve<RankingEntry[]>([]);

    const [balance, totalDebtors, debtorsWithDebt, ranking] = await Promise.all(
      [
        this.prisma.debt.aggregate({
          _sum: { balance: true },
          where: scope,
        }),
        this.prisma.debtor.count({
          where: { businessId, inactivatedAt: null },
        }),
        this.prisma.debtor.count({
          where: {
            businessId,
            inactivatedAt: null,
            debts: { some: { ...openDebts, balance: { gt: 0 } } },
          },
        }),
        rankingQuery,
      ],
    );

    // `groupBy` solo devuelve ids; hay que traer los datos para pintarlos.
    const rows = ranking.length
      ? await this.prisma.debtor.findMany({
          where: { id: { in: ranking.map((entry) => entry.debtorId) } },
          include: { user: { select: userSafeSelect } },
        })
      : [];
    const byId = new Map(rows.map((row) => [row.id, row]));

    const topDebtors = ranking.flatMap((entry) => {
      const debtor = byId.get(entry.debtorId);
      if (!debtor) return [];
      const totalBalance = entry._sum.balance?.toNumber() ?? 0;
      return [{ ...debtor, totalBalance, hasPendingDebt: totalBalance > 0 }];
    });

    return {
      totalBalance: balance._sum.balance?.toNumber() ?? 0,
      totalDebtors,
      debtorsWithDebt,
      debtorsClear: totalDebtors - debtorsWithDebt,
      topDebtors,
    };
  }

  async findAllByUser(userId: string, query: DebtorQueryDto) {
    const { page = 1, limit = 10, search, sortBy, order, hasDebt } = query;

    const memberships = await this.prisma.businessUser.findMany({
      where: { userId },
      select: { businessId: true },
    });

    const businessIds = memberships.map((m) => m.businessId);

    if (!businessIds.length) {
      return {
        data: [],
        meta: {
          total: 0,
          page,
          limit,
          totalPages: 0,
        },
      };
    }

    const where = buildDebtorWhere(
      { businessId: { in: businessIds } },
      search,
      hasDebt,
    );

    const result = await paginate(
      this.prisma.debtor,
      {
        where,
        include: {
          business: {
            select: { id: true, name: true },
          },
          user: { select: userSafeSelect },
          debts: {
            where: {
              status: {
                in: ['OPEN', 'PARTIAL'],
              },
            },
            select: {
              balance: true,
            },
          },
        },
        orderBy: buildOrder(sortBy, order),
      },
      { page, limit },
    );

    const data = result.data as Array<
      Debtor & {
        debts: { balance: Prisma.Decimal }[];
      }
    >;

    return {
      ...result,
      data: data.map(({ debts, ...debtor }) => {
        const totalBalance = debts.reduce(
          (acc, debt) => acc + debt.balance.toNumber(),
          0,
        );

        return {
          ...debtor,
          totalBalance,
          hasPendingDebt: totalBalance > 0,
        };
      }),
    };
  }

  async findOne(id: string, businessId: string): Promise<Debtor> {
    const debtor = await this.prisma.debtor.findUnique({
      where: { id, businessId },
      include: {
        business: { select: { id: true, name: true } },
        user: { select: userSafeSelect },
        debts: true,
      },
    });

    if (!debtor) throw new NotFoundException('Deudor no encontrado');

    if (debtor.inactivatedAt)
      throw new NotFoundException('Deudor se encuentra inactivado');

    return debtor;
  }

  async update(
    id: string,
    businessId: string,
    currentUserId: string,
    data: UpdateDebtorDto,
  ): Promise<Debtor> {
    const debtor = await this.prisma.debtor.findUnique({
      where: { id, businessId },
    });
    if (!debtor) throw new NotFoundException('Deudor no encontrado');

    if (debtor.inactivatedAt)
      throw new NotFoundException('Deudor se encuentra inactivado');

    if (debtor.businessId !== businessId) {
      throw new NotFoundException('Deudor no encontrado en este negocio');
    }

    const updated = await this.prisma.debtor.update({
      where: { id },
      data: {
        ...data,
        // El DTO es parcial, así que la columna de búsqueda se reconstruye
        // mezclando lo que llega con lo que ya había: si solo cambia el
        // teléfono, el nombre tiene que seguir siendo buscable.
        searchText: buildSearchText({
          name: data.name ?? debtor.name,
          phone: data.phone ?? debtor.phone,
          documentNumber: data.documentNumber ?? debtor.documentNumber,
        }),
      },
    });

    await this.auditService.log({
      userId: currentUserId,
      action: AuditAction.DEBTOR_UPDATED,
      entity: 'Debtor',
      entityId: debtor.id,
      meta: {
        debtorId: debtor.id,
        // Los valores anteriores salen de `debtor` (la fila tal como estaba),
        // no de `data`: `data` es el payload entrante, o sea los valores
        // NUEVOS. Al leerlos de ahí, "previous" y "new" guardaban lo mismo y
        // el rastro de auditoría de estos tres campos no servía para nada.
        previousName: debtor.name,
        newName: updated.name,
        previousDocumentNumber: debtor.documentNumber,
        newDocumentNumber: updated.documentNumber,
        previousPhone: debtor.phone,
        newPhone: updated.phone,
        businessId: debtor.businessId,
      },
    });

    return updated;
  }

  async inactivate(
    id: string,
    businessId: string,
    currentUserId: string,
  ): Promise<{ message: string }> {
    const debtor = await this.prisma.debtor.findUnique({
      where: { id, businessId },
      include: {
        debts: {
          where: { status: { in: [DebtStatus.OPEN, DebtStatus.PARTIAL] } },
          select: { balance: true },
        },
      },
    });

    if (!debtor) throw new NotFoundException('Deudor no encontrado');

    if (debtor.inactivatedAt)
      throw new NotFoundException('Deudor se encuentra inactivado');

    /**
     * Las deudas ya se consultaban aquí pero nunca se miraban, así que se podía
     * archivar a alguien que todavía debía plata. Como los totales del negocio
     * excluyen a los deudores inactivados, ese saldo desaparecía del "total por
     * cobrar" sin que nadie lo cancelara: una condonación silenciosa.
     */
    const pending = debtor.debts.reduce(
      (total, debt) => total + debt.balance.toNumber(),
      0,
    );

    if (pending > 0) {
      throw new BadRequestException(
        'No se puede inactivar un deudor con saldo pendiente. Registra el pago o cancela sus deudas primero.',
      );
    }

    await this.prisma.debtor.update({
      where: { id },
      data: {
        inactivatedAt: new Date(),
      },
    });

    await this.auditService.log({
      userId: currentUserId,
      action: AuditAction.DEBTOR_INACTIVATED,
      entity: 'Debtor',
      entityId: debtor.id,
      meta: {
        debtorId: debtor.id,
        businessId: debtor.businessId,
      },
    });

    return { message: 'Deudor inactivado correctamente' };
  }
}
