-- DropForeignKey
ALTER TABLE "Budget" DROP CONSTRAINT "Budget_zone_id_fkey";

-- AlterTable
ALTER TABLE "Budget" ALTER COLUMN "zone_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "Zone"("id") ON DELETE SET NULL ON UPDATE CASCADE;
