-- AlterTable
ALTER TABLE "Group" ADD COLUMN "isDirectMessage" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "recoveryKeyHash" TEXT;
