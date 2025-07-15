/*
  Warnings:

  - A unique constraint covering the columns `[enterprise_id,zone_name]` on the table `Zone` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id,chef_park_id]` on the table `Zone` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Zone_enterprise_id_zone_name_key" ON "Zone"("enterprise_id", "zone_name");

-- CreateIndex
CREATE UNIQUE INDEX "Zone_id_chef_park_id_key" ON "Zone"("id", "chef_park_id");
