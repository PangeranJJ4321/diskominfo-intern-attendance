-- ============================================================================
-- Migration: Attendance table changes & ShiftAssignment creation with data backfill
-- ============================================================================

-- ============================================================================
-- PART 1: Attendance table changes
-- ============================================================================

-- 1. Add the SICK status to AttendanceStatus enum
ALTER TYPE "AttendanceStatus" ADD VALUE 'SICK';

-- 2. Add the new attendancePhotoUrl column
ALTER TABLE "attendance" ADD COLUMN "attendancePhotoUrl" TEXT;

-- 3. Convert date column from Date to String (YYYY-MM-DD format)
ALTER TABLE "attendance" ALTER COLUMN "date" TYPE TEXT
    USING TO_CHAR("date", 'YYYY-MM-DD');

-- 4. Rename agencyScheduleId to scheduleId (IDs are preserved from agency_schedule → schedule)
ALTER TABLE "attendance" RENAME COLUMN "agencyScheduleId" TO "scheduleId";

-- 5. Drop the old unique constraint
ALTER TABLE "attendance" DROP CONSTRAINT IF EXISTS "attendance_internId_agencyScheduleId_date_key";

-- 6. Add the new unique constraint using scheduleId
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_internId_scheduleId_date_key"
    UNIQUE ("internId", "scheduleId", "date");

-- 7. Add FK constraint from attendance to schedule
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_scheduleId_fkey"
    FOREIGN KEY ("scheduleId") REFERENCES "schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 8. Create index on scheduleId
CREATE INDEX "attendance_scheduleId_idx" ON "attendance"("scheduleId");

-- ============================================================================
-- PART 2: ShiftAssignment table
-- ============================================================================

-- 9. Create the shift_assignment table
CREATE TABLE "shift_assignment" (
    "id"        TEXT NOT NULL,
    "internId"  TEXT NOT NULL,
    "shiftId"   TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate"   TEXT,

    CONSTRAINT "shift_assignment_pkey" PRIMARY KEY ("id")
);

-- 10. Create indexes
CREATE INDEX "shift_assignment_internId_startDate_endDate_shiftId_idx"
    ON "shift_assignment"("internId", "startDate", "endDate", "shiftId");

-- 11. Add foreign key constraints
ALTER TABLE "shift_assignment" ADD CONSTRAINT "shift_assignment_internId_fkey"
    FOREIGN KEY ("internId") REFERENCES "intern"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "shift_assignment" ADD CONSTRAINT "shift_assignment_shiftId_fkey"
    FOREIGN KEY ("shiftId") REFERENCES "shift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 12. Backfill shift assignments: assign each intern to their agency's default shift
--     using intern.startedAt as startDate and intern.finishedAt as endDate
INSERT INTO "shift_assignment" ("id", "internId", "shiftId", "startDate", "endDate")
SELECT
    gen_random_uuid()::text,
    i.id,
    s.id,
    TO_CHAR(i."startedAt", 'YYYY-MM-DD'),
    CASE
        WHEN i."finishedAt" IS NOT NULL
        THEN TO_CHAR(i."finishedAt", 'YYYY-MM-DD')
        ELSE NULL
    END
FROM "intern" i
JOIN "agency" a ON a.id = i."agencyId"
JOIN "shift" s ON s.id = a."defaultShiftId";
