/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `MaintenanceRule` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "MaintenanceRule_name_key" ON "MaintenanceRule"("name");
