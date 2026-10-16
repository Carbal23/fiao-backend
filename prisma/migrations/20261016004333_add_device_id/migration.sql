-- Paso 1 de 2 (expand): los dispositivos pasan a identificarse con un
-- deviceId aleatorio y un deviceName legible, en lugar de deviceInfo.
-- La columna deviceInfo se conserva para que el código anterior siga
-- funcionando durante el despliegue; se elimina en una migración posterior.

-- AlterTable
ALTER TABLE "AuthLog" ADD COLUMN     "deviceId" TEXT,
ADD COLUMN     "deviceName" TEXT;

-- AlterTable
ALTER TABLE "RefreshToken" ADD COLUMN     "deviceId" TEXT,
ADD COLUMN     "deviceName" TEXT;

-- Las sesiones y registros existentes guardaban una descripción en
-- deviceInfo ("web", "android 11"): pasa a deviceName, y en las sesiones
-- también a deviceId para que el login desde ese dispositivo la reemplace.
UPDATE "RefreshToken" SET "deviceId" = "deviceInfo", "deviceName" = "deviceInfo"
WHERE "deviceInfo" IS NOT NULL;
UPDATE "AuthLog" SET "deviceName" = "deviceInfo" WHERE "deviceInfo" IS NOT NULL;

-- CreateIndex
CREATE INDEX "RefreshToken_userId_deviceId_idx" ON "RefreshToken"("userId", "deviceId");
