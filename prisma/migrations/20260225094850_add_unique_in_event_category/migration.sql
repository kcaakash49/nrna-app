/*
  Warnings:

  - A unique constraint covering the columns `[parentId,slug]` on the table `EventCategory` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "EventCategory_parentId_slug_key" ON "EventCategory"("parentId", "slug");
