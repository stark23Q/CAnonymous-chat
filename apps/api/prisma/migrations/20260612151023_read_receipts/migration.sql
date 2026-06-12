-- AlterTable
ALTER TABLE "Membership" ADD COLUMN IF NOT EXISTS "lastReadAt" TIMESTAMP(3);
