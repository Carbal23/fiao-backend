import { Controller, Get, Post, Body, Param, Patch } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserResponseDto } from './dto/user-response.dto';
import { ApiAuth } from 'src/common/swagger/auth.decorator';
import { UserDashboardDto } from './dto/user-dashboard.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar un nuevo usuario' })
  @ApiResponse({
    status: 201,
    description: 'Usuario creado correctamente',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o usuario ya existente',
  })
  create(@Body() data: CreateUserDto) {
    return this.usersService.create(data);
  }

  @UseGuards(JwtAuthGuard)
  @ApiAuth()
  @Get()
  @ApiOperation({ summary: 'Obtener todos los usuarios activos' })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuarios',
    type: [UserResponseDto],
  })
  findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @ApiAuth()
  @Get(':id')
  @ApiOperation({ summary: 'Obtener un usuario por ID' })
  @ApiResponse({
    status: 200,
    description: 'Usuario encontrado',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado',
  })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiAuth()
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un usuario' })
  @ApiResponse({
    status: 200,
    description: 'Usuario actualizado',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado',
  })
  update(@Param('id') id: string, @Body() data: UpdateUserDto) {
    return this.usersService.update(id, data);
  }

  @UseGuards(JwtAuthGuard)
  @ApiAuth()
  @Patch(':id/inactivate')
  @ApiOperation({ summary: 'Inactivar un usuario' })
  @ApiResponse({
    status: 200,
    description: 'Usuario inactivado correctamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado',
  })
  inactivate(@Param('id') id: string) {
    return this.usersService.inactivate(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiAuth()
  @Get('me/dashboard')
  @ApiOperation({ summary: 'Obtener dashboard del usuario autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Datos del dashboard',
    type: UserDashboardDto,
  })
  getUserDashboard(@GetUser('id') userId: string) {
    return this.usersService.getUserDashboard(userId);
  }
}
