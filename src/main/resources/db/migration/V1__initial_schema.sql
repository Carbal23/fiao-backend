CREATE TYPE "DocumentType" AS ENUM ('CC', 'NIT', 'FOREIGNER');
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN', 'MODERATOR', 'SUSPENDED');
CREATE TYPE "BusinessUserRole" AS ENUM ('ADMIN', 'CASHIER', 'VIEWER', 'OWNER');
CREATE TYPE "DebtStatus" AS ENUM ('OPEN', 'PARTIAL', 'PAID', 'CANCELLED');
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'TRANSFER', 'OTHER');
CREATE TYPE "PaymentType" AS ENUM ('PAYMENT', 'ADJUSTMENT', 'REVERSAL');
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED');
CREATE TYPE "InvitationType" AS ENUM ('DEBTOR', 'BUSINESS_USER');

CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "password" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "inactivatedAt" TIMESTAMP(3),
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Business" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'COP',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "inactivatedAt" TIMESTAMP(3),
    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BusinessUser" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "BusinessUserRole" NOT NULL DEFAULT 'VIEWER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BusinessUser_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Debtor" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "documentType" "DocumentType",
    "documentNumber" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "inactivatedAt" TIMESTAMP(3),
    CONSTRAINT "Debtor_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Debt" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "debtorId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'COP',
    "description" TEXT,
    "status" "DebtStatus" NOT NULL DEFAULT 'OPEN',
    "dueDate" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Debt_pkey" PRIMARY KEY ("id")
);

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

CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "debtId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "paymentGroupId" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "method" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "type" "PaymentType" NOT NULL DEFAULT 'PAYMENT',
    "note" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "debtorId" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "type" "InvitationType" NOT NULL DEFAULT 'DEBTOR',
    "role" "BusinessUserRole",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deviceInfo" TEXT,
    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
CREATE UNIQUE INDEX "User_documentNumber_key" ON "User"("documentNumber");
CREATE UNIQUE INDEX "BusinessUser_businessId_userId_key" ON "BusinessUser"("businessId", "userId");
CREATE INDEX "Debtor_businessId_phone_idx" ON "Debtor"("businessId", "phone");
CREATE INDEX "Debtor_businessId_documentNumber_idx" ON "Debtor"("businessId", "documentNumber");
CREATE INDEX "Debt_businessId_debtorId_idx" ON "Debt"("businessId", "debtorId");
CREATE INDEX "Payment_businessId_idx" ON "Payment"("businessId");
CREATE INDEX "Payment_debtId_businessId_idx" ON "Payment"("debtId", "businessId");
CREATE INDEX "Payment_paymentGroupId_idx" ON "Payment"("paymentGroupId");
CREATE INDEX "PaymentGroup_businessId_idx" ON "PaymentGroup"("businessId");
CREATE INDEX "PaymentGroup_debtorId_idx" ON "PaymentGroup"("debtorId");
CREATE INDEX "PaymentGroup_reversedAt_idx" ON "PaymentGroup"("reversedAt");
CREATE UNIQUE INDEX "Invitation_code_key" ON "Invitation"("code");
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

ALTER TABLE "Business" ADD CONSTRAINT "Business_ownerId_fkey"
    FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BusinessUser" ADD CONSTRAINT "BusinessUser_businessId_fkey"
    FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BusinessUser" ADD CONSTRAINT "BusinessUser_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Debtor" ADD CONSTRAINT "Debtor_businessId_fkey"
    FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Debtor" ADD CONSTRAINT "Debtor_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Debt" ADD CONSTRAINT "Debt_businessId_fkey"
    FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Debt" ADD CONSTRAINT "Debt_debtorId_fkey"
    FOREIGN KEY ("debtorId") REFERENCES "Debtor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Debt" ADD CONSTRAINT "Debt_createdBy_fkey"
    FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_debtId_fkey"
    FOREIGN KEY ("debtId") REFERENCES "Debt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_createdBy_fkey"
    FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_businessId_fkey"
    FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_paymentGroupId_fkey"
    FOREIGN KEY ("paymentGroupId") REFERENCES "PaymentGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PaymentGroup" ADD CONSTRAINT "PaymentGroup_businessId_fkey"
    FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PaymentGroup" ADD CONSTRAINT "PaymentGroup_debtorId_fkey"
    FOREIGN KEY ("debtorId") REFERENCES "Debtor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_businessId_fkey"
    FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_debtorId_fkey"
    FOREIGN KEY ("debtorId") REFERENCES "Debtor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
