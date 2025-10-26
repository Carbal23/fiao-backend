/*
  Warnings:

  - The values [OWNER,EMPLOYEE,CLIENT] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
ALTER TYPE "BusinessUserRole" ADD VALUE 'OWNER';

-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('USER', 'ADMIN', 'MODERATOR', 'SUSPENDED');
ALTER TABLE "public"."User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'USER';
COMMIT;

-- AlterTable
ALTER TABLE "BusinessUser" ALTER COLUMN "role" SET DEFAULT 'VIEWER';

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'USER';
