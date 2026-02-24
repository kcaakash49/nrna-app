-- CreateEnum
CREATE TYPE "PageTemplate" AS ENUM ('STANDARD', 'GALLERY_INDEX', 'COMMITTEE_DIRECTORY', 'DOWNLOADS_INDEX', 'EVENTS_INDEX');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "categoryId" TEXT;

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "pageTemplate" "PageTemplate" DEFAULT 'STANDARD';

-- CreateTable
CREATE TABLE "EventCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "parentId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "EventCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventCategory_slug_key" ON "EventCategory"("slug");

-- CreateIndex
CREATE INDEX "EventCategory_parentId_order_idx" ON "EventCategory"("parentId", "order");

-- AddForeignKey
ALTER TABLE "EventCategory" ADD CONSTRAINT "EventCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "EventCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "EventCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
