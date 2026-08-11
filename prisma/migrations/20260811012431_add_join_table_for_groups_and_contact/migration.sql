/*
  Warnings:

  - You are about to drop the column `groupId` on the `Contact` table. All the data in the column will be lost.
  - You are about to drop the `ContactGroup` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Contact" DROP CONSTRAINT "Contact_groupId_fkey";

-- AlterTable
ALTER TABLE "Contact" DROP COLUMN "groupId";

-- DropTable
DROP TABLE "ContactGroup";

-- CreateTable
CREATE TABLE "Groups" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "prompt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupContact" (
    "contactId" INTEGER NOT NULL,
    "groupId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupContact_pkey" PRIMARY KEY ("contactId","groupId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Groups_name_key" ON "Groups"("name");

-- CreateIndex
CREATE INDEX "GroupContact_groupId_idx" ON "GroupContact"("groupId");

-- AddForeignKey
ALTER TABLE "GroupContact" ADD CONSTRAINT "GroupContact_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupContact" ADD CONSTRAINT "GroupContact_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
