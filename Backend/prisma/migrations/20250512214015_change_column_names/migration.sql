/*
  Warnings:

  - You are about to drop the column `phoneNumber` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `chefPark_id` on the `Zone` table. All the data in the column will be lost.
  - Added the required column `phone_number` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Zone" DROP CONSTRAINT "Zone_chefPark_id_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "phoneNumber",
ADD COLUMN     "phone_number" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Zone" DROP COLUMN "chefPark_id",
ADD COLUMN     "chef_park_id" TEXT;

-- AddForeignKey
ALTER TABLE "Zone" ADD CONSTRAINT "Zone_chef_park_id_fkey" FOREIGN KEY ("chef_park_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
