import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateUserDto): Promise<Omit<User, 'password'>> {
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
      });

      const { password, ...result } = user;
      return result;
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

  async findAll(): Promise<
    Omit<User, 'password' | 'inactivatedAt' | 'updatedAt'>[]
  > {
    return this.prisma.user.findMany({
      where: { inactivatedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        documentType: true,
        documentNumber: true,
      },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findOne(id: string): Promise<Omit<User, 'password'> | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const { password, ...result } = user;
    return result;
  }

  async update(
    id: string,
    data: UpdateUserDto,
  ): Promise<Omit<User, 'password'>> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const updateData = { ...data };

    // Si viene password, la encriptamos
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
    });

    const { password, ...result } = updated;
    return result;
  }

  async inactivate(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id },
      data: { inactivatedAt: new Date() },
    });

    const { password, ...result } = updated;
    return {
      message: 'User inactivated successfully',
      user: result,
    };
  }
}
