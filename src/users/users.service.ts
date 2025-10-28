import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserSafe, userSafeSelect } from './user.select';
import { UserDashboardDto } from './dto/user-dashboard.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateUserDto): Promise<UserSafe> {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email ?? undefined },
          { phone: data.phone ?? undefined },
          { documentNumber: data.documentNumber },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.inactivatedAt) {
        throw new BadRequestException(
          `Ya existe un usuario registrado con ${
            existingUser.email === data.email
              ? 'este correo electrónico'
              : existingUser.phone === data.phone
                ? 'este número de teléfono'
                : 'este número de documento'
          }, pero actualmente está inactivo.`,
        );
      }

      if (existingUser.email === data.email) {
        throw new BadRequestException(
          'El correo electrónico ya está registrado.',
        );
      }
      if (existingUser.phone === data.phone) {
        throw new BadRequestException(
          'El número de teléfono ya está registrado.',
        );
      }
      if (existingUser.documentNumber === data.documentNumber) {
        throw new BadRequestException(
          'El número de documento ya está registrado.',
        );
      }
    }
    const hashedPassword: string = await (
      bcrypt as unknown as {
        hash: (s: string, rounds: number) => Promise<string>;
      }
    ).hash(data.password, 10);

    try {
      const user = await this.prisma.user.create({
        data: {
          ...data,
          password: hashedPassword,
        },
        select: userSafeSelect,
      });

      const debtorMatches = await this.prisma.debtor.findMany({
        where: {
          OR: [
            { documentNumber: data.documentNumber ?? undefined },
            { phone: data.phone ?? undefined },
          ],
          userId: null,
        },
      });

      if (debtorMatches.length > 0) {
        await this.prisma.debtor.updateMany({
          where: {
            id: { in: debtorMatches.map((d) => d.id) },
          },
          data: { userId: user.id },
        });

        console.log(
          `🔗 Vinculados ${debtorMatches.length} deudores al usuario ${user.id}`,
        );
      }

      return user;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const field = (error.meta?.target as string[])?.join(', ');
          throw new BadRequestException(
            `Ya existe un usuario con el campo único: ${field}.`,
          );
        }
      }
      throw error;
    }
  }

  async findAll(): Promise<UserSafe[]> {
    const users = this.prisma.user.findMany({
      where: { inactivatedAt: null },
      select: userSafeSelect,
    });

    return users;
  }

  async findOne(id: string): Promise<UserSafe | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: userSafeSelect,
    });
    if (!user) throw new NotFoundException('User not found');

    return user;
  }

  async update(id: string, data: UpdateUserDto): Promise<UserSafe> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: userSafeSelect,
    });
    if (!user) throw new NotFoundException('User not found');

    const updateData = { ...data };

    if (data.password) {
      updateData.password = await (
        bcrypt as unknown as {
          hash: (s: string, rounds: number) => Promise<string>;
        }
      ).hash(data.password, 10);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: userSafeSelect,
    });

    return updated;
  }

  async inactivate(id: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.user.update({
      where: { id },
      data: { inactivatedAt: new Date() },
    });

    return {
      message: 'User inactivated successfully',
    };
  }

  async getUserDashboard(userId: string): Promise<UserDashboardDto> {
    const userExists = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!userExists) throw new Error('Usuario no encontrado');

    const [ownedBusinesses, workingBusinesses, clientBusinesses] =
      await Promise.all([
        this.prisma.business.findMany({
          where: { ownerId: userId },
          select: {
            id: true,
            name: true,
            address: true,
            currency: true,
            createdAt: true,
          },
        }),
        this.prisma.businessUser.findMany({
          where: { userId },
          select: {
            id: true,
            role: true,
            business: {
              select: {
                id: true,
                name: true,
                address: true,
                currency: true,
              },
            },
          },
        }),
        this.prisma.debtor.findMany({
          where: { userId },
          select: {
            id: true,
            name: true,
            phone: true,
            business: {
              select: {
                id: true,
                name: true,
                currency: true,
              },
            },
          },
        }),
      ]);

    return {
      ownedBusinesses,
      workingBusinesses,
      clientBusinesses,
    };
  }
}
