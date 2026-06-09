-- ============================================================================
-- Migration: Fix agency_holiday date type and missing index
-- ============================================================================
-- 1. Convert agency_holiday.date from DATE to TEXT (YYYY-MM-DD) to match schema
-- 2. Add index on agency_holiday.agencyId for query performance

-- Part 1: Convert date column type
ALTER TABLE "agency_holiday" ALTER COLUMN "date" TYPE TEXT
    USING TO_CHAR("date", 'YYYY-MM-DD');

-- Part 2: Add missing index on agencyId
CREATE INDEX "agency_holiday_agencyId_idx" ON "agency_holiday"("agencyId");