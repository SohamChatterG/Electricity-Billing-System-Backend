/*
  Warnings:

  - Added the required column `updatedAt` to the `Connection` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Connection" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
