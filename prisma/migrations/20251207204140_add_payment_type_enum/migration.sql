-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('PAYMENT', 'ADJUSTMENT', 'REVERSAL');

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "type" "PaymentType" NOT NULL DEFAULT 'PAYMENT';
