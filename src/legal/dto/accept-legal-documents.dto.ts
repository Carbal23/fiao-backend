import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class AcceptLegalDocumentsDto {
  @ApiProperty({
    type: [String],
    example: ['6b1f3c2e-8a4d-4c9b-9e2f-1a2b3c4d5e6f'],
    description: 'Ids de los documentos que el usuario acepta',
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  documentIds!: string[];
}
