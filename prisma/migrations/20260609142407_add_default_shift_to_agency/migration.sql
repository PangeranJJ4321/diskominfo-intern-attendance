-- AlterTable
ALTER TABLE "agency" ADD COLUMN     "defaultShiftId" TEXT;

-- CreateIndex
CREATE INDEX "agency_defaultShiftId_idx" ON "agency"("defaultShiftId");

-- AddForeignKey
ALTER TABLE "agency" ADD CONSTRAINT "agency_defaultShiftId_fkey" FOREIGN KEY ("defaultShiftId") REFERENCES "shift"("id") ON DELETE SET NULL ON UPDATE CASCADE;
