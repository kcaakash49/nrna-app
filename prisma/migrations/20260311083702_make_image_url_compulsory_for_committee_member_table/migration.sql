/*
  Warnings:

  - Made the column `imageUrl` on table `CommitteeMember` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "CommitteeMember" ALTER COLUMN "imageUrl" SET NOT NULL;
