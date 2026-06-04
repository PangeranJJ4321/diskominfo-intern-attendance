/*
  Warnings:

  - You are about to drop the column `name` on the `agency_area` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[agencyId]` on the table `agency_area` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "agency_area" DROP COLUMN "name",
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'Asia/Makassar';

-- CreateIndex
CREATE UNIQUE INDEX "agency_area_agencyId_key" ON "agency_area"("agencyId");
