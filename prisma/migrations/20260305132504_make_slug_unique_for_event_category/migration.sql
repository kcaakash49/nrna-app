/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `EventCategory` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "EventCategory_slug_key" ON "EventCategory"("slug");
