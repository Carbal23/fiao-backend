import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBusinessUserDto } from './dto/create-business-user.dto';
import { UpdateBusinessUserDto } from './dto/update-business-user.dto';
import { BusinessUserRole } from '@prisma/client';
import { BusinessUserResponse } from './interfaces/business-user.interface';

@Injectable()
export class BusinessUserService {
  constructor(private readonly prisma: PrismaService) {}

  async addUserToBusiness(
    businessId: string,
    dto: CreateBusinessUserDto,
  ): Promise<BusinessUserResponse> {
    const { userId, role } = dto;

    const exists = await this.prisma.businessUser.findUnique({
      where: {
        businessId_userId: { businessId, userId },
      },
    });
    if (exists)
      throw new BadRequestException('El usuario ya pertenece al negocio');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no registrado en la app');

    return this.prisma.businessUser.create({
      data: {
        businessId,
        userId,
        role: role || BusinessUserRole.VIEWER,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });
  }

  async getUsersByBusiness(
    businessId: string,
  ): Promise<BusinessUserResponse[]> {
    return this.prisma.businessUser.findMany({
      where: { businessId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateUserRole(
    businessId: string,
    businessUserId: string,
    dto: UpdateBusinessUserDto,
    currentUserId: string,
  ): Promise<BusinessUserResponse> {
    const membership = await this.prisma.businessUser.findUnique({
      where: { id: businessUserId },
    });
    if (!membership)
      throw new NotFoundException('Usuario no encontrado en el negocio');

    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException('Negocio no encontrado');

    if (membership.userId === business.ownerId) {
      throw new ForbiddenException(
        'No puedes modificar el rol del propietario del negocio',
      );
    }

    if (membership.userId === currentUserId) {
      throw new ForbiddenException('No puedes modificar tu propio rol');
    }

    return this.prisma.businessUser.update({
      where: { id: businessUserId },
      data: { role: dto.role },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });
  }

  async removeUserFromBusiness(
    businessId: string,
    businessUserId: string,
    currentUserId: string,
  ): Promise<{ message: string }> {
    const membership = await this.prisma.businessUser.findUnique({
      where: { id: businessUserId },
    });
    if (!membership)
      throw new NotFoundException('Usuario no encontrado en el negocio');

    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException('Negocio no encontrado');

    if (membership.userId === business.ownerId) {
      throw new ForbiddenException(
        'No puedes eliminar al propietario del negocio',
      );
    }

    if (membership.userId === currentUserId) {
      throw new ForbiddenException('No puedes eliminarte a ti mismo');
    }

    await this.prisma.businessUser.delete({
      where: { id: businessUserId },
    });

    return { message: 'Usuario eliminado del negocio correctamente' };
  }
}
