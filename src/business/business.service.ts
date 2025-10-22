import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { BusinessUserRole } from '@prisma/client';

@Injectable()
export class BusinessService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createBusinessDto: CreateBusinessDto, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const business = await tx.business.create({
        data: {
          ...createBusinessDto,
          ownerId: userId,
        },
      });

      await tx.businessUser.create({
        data: {
          businessId: business.id,
          userId,
          role: BusinessUserRole.ADMIN,
        },
      });

      return business;
    });
  }

  async findAllByUser(userId: string) {
    return this.prisma.business.findMany({
      where: {
        OR: [{ ownerId: userId }, { businessUsers: { some: { userId } } }],
      },
      include: {
        businessUsers: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const business = await this.prisma.business.findUnique({
      where: { id },
      include: {
        businessUsers: true,
      },
    });

    if (!business) throw new NotFoundException('Negocio no encontrado');

    const isMember =
      business.ownerId === userId ||
      business.businessUsers.some((u) => u.userId === userId);
    if (!isMember)
      throw new ForbiddenException('No tienes acceso a este negocio');

    return business;
  }

  async update(id: string, dto: UpdateBusinessDto, userId: string) {
    const business = await this.prisma.business.findUnique({ where: { id } });
    if (!business) throw new NotFoundException('Negocio no encontrado');
    if (business.ownerId !== userId)
      throw new ForbiddenException(
        'Solo el propietario puede actualizar el negocio',
      );

    return this.prisma.business.update({
      where: { id },
      data: dto,
    });
  }
}
