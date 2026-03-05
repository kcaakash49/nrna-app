-- CreateEnum
CREATE TYPE "InternalRefType" AS ENUM ('POST', 'EVENT');

-- AlterTable
ALTER TABLE "MenuItem" ADD COLUMN     "internalRefId" TEXT,
ADD COLUMN     "internalRefType" "InternalRefType";
