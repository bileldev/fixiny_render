/*
  Warnings:

  - Added the required column `status` to the `Maintenance` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MaintenanceStatus" AS ENUM ('DONE', 'OVERDUE', 'UPCOMING');

-- AlterTable
ALTER TABLE "Maintenance" ADD COLUMN     "status" "MaintenanceStatus" NOT NULL;
