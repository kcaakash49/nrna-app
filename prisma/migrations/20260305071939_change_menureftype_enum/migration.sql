/*
  Warnings:

  - The values [EVENT_CATEOGORY] on the enum `MenuRefType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "MenuRefType_new" AS ENUM ('POST', 'EVENT', 'EVENT_CATEGORY');
ALTER TABLE "MenuItem" ALTER COLUMN "refType" TYPE "MenuRefType_new" USING ("refType"::text::"MenuRefType_new");
ALTER TYPE "MenuRefType" RENAME TO "MenuRefType_old";
ALTER TYPE "MenuRefType_new" RENAME TO "MenuRefType";
DROP TYPE "public"."MenuRefType_old";
COMMIT;
