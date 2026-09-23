/*
  Warnings:

  - Added the required column `businessId` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "InvitationType" AS ENUM ('DEBTOR', 'BUSINESS_USER');

-- DropIndex
DROP INDEX "Payment_debtId_idx";

-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "inactivatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Debtor" ADD COLUMN     "inactivatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Invitation" ADD COLUMN     "role" "BusinessUserRole",
ADD COLUMN     "type" "InvitationType" NOT NULL DEFAULT 'DEBTOR';

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "businessId" TEXT NOT NULL,
ADD COLUMN     "paymentGroupId" TEXT,
ALTER COLUMN "method" SET DEFAULT 'CASH';

-- CreateTable
CREATE TABLE "PaymentGroup" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "debtorId" TEXT NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reversedAt" TIMESTAMP(3),

    CONSTRAINT "PaymentGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentGroup_businessId_idx" ON "PaymentGroup"("businessId");

-- CreateIndex
CREATE INDEX "PaymentGroup_debtorId_idx" ON "PaymentGroup"("debtorId");

-- CreateIndex
CREATE INDEX "PaymentGroup_reversedAt_idx" ON "PaymentGroup"("reversedAt");

-- CreateIndex
CREATE INDEX "Payment_businessId_idx" ON "Payment"("businessId");

-- CreateIndex
CREATE INDEX "Payment_debtId_businessId_idx" ON "Payment"("debtId", "businessId");

-- CreateIndex
CREATE INDEX "Payment_paymentGroupId_idx" ON "Payment"("paymentGroupId");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_paymentGroupId_fkey" FOREIGN KEY ("paymentGroupId") REFERENCES "PaymentGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentGroup" ADD CONSTRAINT "PaymentGroup_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentGroup" ADD CONSTRAINT "PaymentGroup_debtorId_fkey" FOREIGN KEY ("debtorId") REFERENCES "Debtor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
