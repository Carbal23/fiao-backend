import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { LegalDocument, LegalDocumentType, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import type { RequestContext } from 'src/auth-log/auth-log.types';

const DOCUMENT_TYPES = Object.values(LegalDocumentType);

@Injectable()
export class LegalService {
  constructor(private readonly prisma: PrismaService) {}

  /** La versión vigente de cada tipo es la más reciente ya publicada. */
  async getCurrentDocuments(): Promise<LegalDocument[]> {
    const now = new Date();
    const documents = await Promise.all(
      DOCUMENT_TYPES.map((type) =>
        this.prisma.legalDocument.findFirst({
          where: { type, publishedAt: { lte: now } },
          orderBy: { publishedAt: 'desc' },
        }),
      ),
    );

    return documents.filter((doc): doc is LegalDocument => doc !== null);
  }

  /** Documentos vigentes que el usuario todavía no ha aceptado. */
  async getPendingDocuments(userId: string): Promise<LegalDocument[]> {
    const current = await this.getCurrentDocuments();
    if (!current.length) return [];

    const accepted = await this.prisma.userConsent.findMany({
      where: { userId, documentId: { in: current.map((doc) => doc.id) } },
      select: { documentId: true },
    });
    const acceptedIds = new Set(accepted.map((consent) => consent.documentId));

    return current.filter((doc) => !acceptedIds.has(doc.id));
  }

  /**
   * Para registrarse hay que aceptar la versión vigente de todos los
   * documentos. Si el frontend envía una versión vieja (por ejemplo, porque se
   * publicó una nueva mientras el usuario llenaba el formulario), se rechaza
   * para que vuelva a mostrar el texto actual.
   */
  async assertAcceptsAllCurrent(documentIds: string[]): Promise<void> {
    const current = await this.getCurrentDocuments();

    if (current.length !== DOCUMENT_TYPES.length) {
      throw new ServiceUnavailableException(
        'No hay documentos legales vigentes publicados. No es posible registrarse en este momento.',
      );
    }

    const missing = current.filter((doc) => !documentIds.includes(doc.id));
    if (missing.length || documentIds.length !== current.length) {
      throw new BadRequestException(
        'Debes aceptar la versión vigente de los términos y condiciones y de la política de tratamiento de datos.',
      );
    }
  }

  /** Registra las aceptaciones. Si alguna ya existía, se ignora. */
  async recordConsents(
    db: Prisma.TransactionClient,
    userId: string,
    documentIds: string[],
    context?: RequestContext,
  ): Promise<void> {
    await db.userConsent.createMany({
      data: documentIds.map((documentId) => ({
        userId,
        documentId,
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
      })),
      skipDuplicates: true,
    });
  }

  /** Aceptación de documentos pendientes por un usuario ya registrado. */
  async acceptDocuments(
    userId: string,
    documentIds: string[],
    context?: RequestContext,
  ): Promise<LegalDocument[]> {
    const current = await this.getCurrentDocuments();
    const currentIds = new Set(current.map((doc) => doc.id));

    if (documentIds.some((id) => !currentIds.has(id))) {
      throw new BadRequestException(
        'Uno de los documentos no corresponde a la versión vigente. Vuelve a cargar los documentos.',
      );
    }

    await this.recordConsents(this.prisma, userId, documentIds, context);

    return this.getPendingDocuments(userId);
  }
}
