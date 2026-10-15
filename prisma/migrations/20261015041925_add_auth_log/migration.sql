-- CreateEnum
CREATE TYPE "AuthLogEvent" AS ENUM ('LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGIN_BLOCKED', 'LOGOUT', 'LOGOUT_ALL_DEVICES', 'PASSWORD_CHANGED', 'PASSWORD_CHANGE_FAILED');

-- CreateTable
CREATE TABLE "AuthLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "event" "AuthLogEvent" NOT NULL,
    "identifier" TEXT,
    "reason" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "deviceInfo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuthLog_userId_createdAt_idx" ON "AuthLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AuthLog_createdAt_idx" ON "AuthLog"("createdAt");

-- AddForeignKey
ALTER TABLE "AuthLog" ADD CONSTRAINT "AuthLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

