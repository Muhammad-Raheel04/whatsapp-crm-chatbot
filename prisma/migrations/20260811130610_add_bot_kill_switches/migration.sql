-- AlterTable
ALTER TABLE "Groups" ADD COLUMN     "aiEnabled" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "aiEnabled" BOOLEAN NOT NULL DEFAULT true;
