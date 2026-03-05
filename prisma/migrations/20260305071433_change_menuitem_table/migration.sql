/*
  Warnings:

  - You are about to drop the column `internalRefId` on the `MenuItem` table. All the data in the column will be lost.
  - You are about to drop the column `internalRefType` on the `MenuItem` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "MenuRefType" AS ENUM ('POST', 'EVENT', 'EVENT_CATEOGORY');

-- CreateEnum
CREATE TYPE "MenuItemKind" AS ENUM ('URL', 'POST_PAGE', 'EVENT', 'EVENT_CATEGORY', 'DROPDOWN');

-- AlterTable
ALTER TABLE "MenuItem" DROP COLUMN "internalRefId",
DROP COLUMN "internalRefType",
ADD COLUMN     "kind" "MenuItemKind" NOT NULL DEFAULT 'URL',
ADD COLUMN     "refId" TEXT,
ADD COLUMN     "refType" "MenuRefType",
ALTER COLUMN "order" SET DEFAULT 0;

-- DropEnum
DROP TYPE "InternalRefType";

-- CreateIndex
CREATE INDEX "MenuItem_menuId_refType_idx" ON "MenuItem"("menuId", "refType");
