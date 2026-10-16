-- Rotación de refresh tokens: cada uso emite un token nuevo de la misma
-- familia (sesión) y el anterior queda marcado como rotado.

-- AlterEnum
ALTER TYPE "AuthLogEvent" ADD VALUE 'REFRESH_TOKEN_REUSED';

-- AlterTable
ALTER TABLE "RefreshToken" ADD COLUMN "familyId" TEXT,
ADD COLUMN "rotatedAt" TIMESTAMP(3);

-- Las sesiones existentes siguen vigentes: cada una es su propia familia.
UPDATE "RefreshToken" SET "familyId" = "id";
ALTER TABLE "RefreshToken" ALTER COLUMN "familyId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "RefreshToken_familyId_idx" ON "RefreshToken"("familyId");
