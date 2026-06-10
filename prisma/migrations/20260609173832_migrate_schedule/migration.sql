-- ============================================================================
-- Migration: Introduce Shift & Schedule tables, replace AgencySchedule
-- ============================================================================

-- 1. Create the Shift table
CREATE TABLE "shift" (
    "id"             TEXT NOT NULL,
    "agencyId"       TEXT NOT NULL,
    "name"           TEXT NOT NULL,
    "workOnHolidays" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt"      TIMESTAMP(3),

    CONSTRAINT "shift_pkey" PRIMARY KEY ("id")
);

-- 2. Create the Schedule table
CREATE TABLE "schedule" (
    "id"            TEXT NOT NULL,
    "shiftId"       TEXT NOT NULL,
    "name"          TEXT NOT NULL,
    "dayOfWeek"     INTEGER NOT NULL,
    "windowStart"   TEXT NOT NULL,
    "scheduleStart" TEXT NOT NULL,
    "lateCutoff"    TEXT NOT NULL,
    "scheduleEnd"   TEXT NOT NULL,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL,
    "deletedAt"     TIMESTAMP(3),

    CONSTRAINT "schedule_pkey" PRIMARY KEY ("id")
);

-- 3. Add defaultShiftId column to Agency
ALTER TABLE "agency" ADD COLUMN "defaultShiftId" TEXT;

-- 4. Create indexes
CREATE INDEX "shift_agencyId_idx" ON "shift"("agencyId");
CREATE INDEX "schedule_shiftId_idx" ON "schedule"("shiftId");
CREATE INDEX "agency_defaultShiftId_idx" ON "agency"("defaultShiftId");

-- 5. Add foreign key constraints for the new tables
ALTER TABLE "shift" ADD CONSTRAINT "shift_agencyId_fkey"
    FOREIGN KEY ("agencyId") REFERENCES "agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "schedule" ADD CONSTRAINT "schedule_shiftId_fkey"
    FOREIGN KEY ("shiftId") REFERENCES "shift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================================
-- DATA MIGRATION
-- ============================================================================

-- 6. Create one default shift per agency
INSERT INTO "shift" ("id", "agencyId", "name", "workOnHolidays")
SELECT
    'c' || SUBSTR(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT), 1, 24),
    id,
    'Default Shift',
    false
FROM "agency";

-- 7. Link each agency to its newly created default shift
UPDATE "agency" a
SET "defaultShiftId" = s.id
FROM "shift" s
WHERE s."agencyId" = a.id;

-- 8. Now that data is in place, add the FK constraint for agency.defaultShiftId
ALTER TABLE "agency" ADD CONSTRAINT "agency_defaultShiftId_fkey"
    FOREIGN KEY ("defaultShiftId") REFERENCES "shift"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 9. Migrate data from agency_schedule to schedule
--    Preserve agency_schedule.id as schedule.id so attendance FK mapping stays intact
--    - agencyScheduleStart → windowStart AND scheduleStart
--    - agencyScheduleEnd   → lateCutoff
--    - lateCutoff + lateToleranceMinutes → scheduleEnd
INSERT INTO "schedule" ("id", "shiftId", "name", "dayOfWeek", "windowStart", "scheduleStart", "lateCutoff", "scheduleEnd", "createdAt", "updatedAt")
SELECT
    ags.id,
    s.id,
    ags.name,
    ags."dayOfWeek",
    SPLIT_PART(ags."agencyScheduleStart", ':', 1) || ':' || SPLIT_PART(ags."agencyScheduleStart", ':', 2) || ':00' AS "windowStart",
    SPLIT_PART(ags."agencyScheduleStart", ':', 1) || ':' || SPLIT_PART(ags."agencyScheduleStart", ':', 2) || ':00' AS "scheduleStart",
    SPLIT_PART(ags."agencyScheduleEnd", ':', 1)   || ':' || SPLIT_PART(ags."agencyScheduleEnd", ':', 2)   || ':00' AS "lateCutoff",
    TO_CHAR(
        (SPLIT_PART(ags."agencyScheduleEnd", ':', 1) || ':' || SPLIT_PART(ags."agencyScheduleEnd", ':', 2) || ':00')::time
        + (COALESCE(ar."lateToleranceMinutes", 0) * INTERVAL '1 minute'),
        'HH24:MI:SS'
    )                                  AS "scheduleEnd",
    ags."createdAt",
    ags."updatedAt"
FROM "agency_schedule" ags
JOIN "shift" s ON s."agencyId" = ags."agencyId"
LEFT JOIN "agency_rule" ar ON ar."agencyId" = ags."agencyId";

-- ============================================================================
-- CLEANUP: Remove old schema artifacts
-- ============================================================================

-- 10. Drop the FK from attendance to agency_schedule (attendance migration handles the rest)
ALTER TABLE "attendance" DROP CONSTRAINT IF EXISTS "attendance_agencyScheduleId_fkey";

-- 11. Drop the old agency_schedule table
DROP TABLE "agency_schedule";

-- 12. Remove lateToleranceMinutes from agency_rule (now per-schedule via scheduleEnd)
ALTER TABLE "agency_rule" DROP COLUMN "lateToleranceMinutes";