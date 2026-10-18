import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ApiAuth } from 'src/common/swagger/auth.decorator';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { ReqContext } from 'src/common/decorators/request-context.decorator';
import type { RequestContext } from 'src/auth-log/auth-log.types';
import { LegalService } from './legal.service';
import { AcceptLegalDocumentsDto } from './dto/accept-legal-documents.dto';
import { LegalDocumentResponseDto } from './dto/legal-document-response.dto';

@ApiTags('Legal')
@Controller('legal')
export class LegalController {
  constructor(private readonly legalService: LegalService) {}

  @Get('current')
  @ApiOperation({
    summary: 'Documentos legales vigentes',
    description:
      'Público. Devuelve la versión vigente de los términos y condiciones y de la política de tratamiento de datos, con su texto. El registro debe enviar estos ids en acceptedLegalDocumentIds.',
  })
  @ApiResponse({ status: 200, type: [LegalDocumentResponseDto] })
  getCurrent() {
    return this.legalService.getCurrentDocuments();
  }

  @UseGuards(JwtAuthGuard)
  @ApiAuth()
  @Get('pending')
  @ApiOperation({
    summary: 'Documentos que el usuario autenticado aún no ha aceptado',
  })
  @ApiResponse({ status: 200, type: [LegalDocumentResponseDto] })
  getPending(@GetUser('id') userId: string) {
    return this.legalService.getPendingDocuments(userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiAuth()
  @Post('accept')
  @ApiOperation({
    summary: 'Aceptar documentos pendientes',
    description:
      'Registra la aceptación de los documentos indicados (deben ser la versión vigente) y devuelve los que sigan pendientes.',
  })
  @ApiResponse({ status: 201, type: [LegalDocumentResponseDto] })
  @ApiResponse({
    status: 400,
    description: 'Algún documento no es la versión vigente',
  })
  accept(
    @GetUser('id') userId: string,
    @Body() dto: AcceptLegalDocumentsDto,
    @ReqContext() context: RequestContext,
  ) {
    return this.legalService.acceptDocuments(userId, dto.documentIds, context);
  }
}
