/*
  Warnings:

  - Changed the type of `type` on the `Notification` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('MAINTENANCE_UPCOMING', 'MAINTENANCE_OVERDUE', 'MAINTENANCE_COMPLETED', 'MAINTENANCE_UPCOMING_ADMIN', 'MAINTENANCE_OVERDUE_ADMIN', 'MAINTENANCE_COMPLETED_ADMIN');

-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "type",
ADD COLUMN     "type" "NotificationType" NOT NULL;
