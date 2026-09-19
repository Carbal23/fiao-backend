import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';

/**
 * Filtros del listado de deudores.
 *
 * Extiende el DTO de paginación común en vez de modificarlo porque `hasDebt`
 * solo tiene sentido aquí, y `PaginationDto` lo comparten ocho servicios.
 */
export class DebtorQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description:
      'true: solo deudores con saldo pendiente. false: solo los que están al día.',
    example: true,
  })
  @IsOptional()
  // Los query params llegan siempre como string; sin esto `"false"` sería
  // truthy y el filtro de "al día" devolvería justo lo contrario.
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  hasDebt?: boolean;
}
