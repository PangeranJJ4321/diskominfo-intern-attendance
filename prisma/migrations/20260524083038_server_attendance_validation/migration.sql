/*
  Warnings:

  - You are about to drop the column `attendanceFaceVerified` on the `attendance` table. All the data in the column will be lost.
  - You are about to drop the column `attendanceWithinArea` on the `attendance` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "attendance" DROP COLUMN "attendanceFaceVerified",
DROP COLUMN "attendanceWithinArea",
ADD COLUMN     "attendanceFaceDescriptor" JSONB;
