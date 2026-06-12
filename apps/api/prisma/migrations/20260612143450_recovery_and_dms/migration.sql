-- AlterTable
ALTER TABLE "Group" ADD COLUMN IF NOT EXISTS "isDirectMessage" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "recoveryKeyHash" TEXT;
