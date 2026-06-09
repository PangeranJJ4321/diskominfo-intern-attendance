// lib/attendance-time-verifier.ts
import { formatInTimeZone } from "date-fns-tz";
import { formatTimeToApi } from "./time-utils";
import { subDays, addDays } from "date-fns";
import type { AttendanceStatusType } from "@/interfaces/enums";
import { AttendanceStatus } from "@/interfaces/enums";

interface TimeCheckResult {
  isValid: boolean;
  error: string | null;
  currentLocalTimeStr: string;
  currentLocalDateStr: string;
}

/**
 * Parses a date and time string in a specific timezone to a UTC Date object.
 *
 * @param dateStr - The date string in YYYY-MM-DD format.
 * @param timeStr - The time string in HH:MM:SS format.
 * @param timezone - The timezone name.
 * @returns The absolute Date object.
 */
function parseZonedDateTime(
  dateStr: string,
  timeStr: string,
  timezone: string,
): Date {
  const tentative = new Date(`${dateStr}T${timeStr}Z`);
  const offsetStr = formatInTimeZone(tentative, timezone, "XXX");
  return new Date(`${dateStr}T${timeStr}${offsetStr}`);
}

/**
 * Validates if the current local time in the specified timezone is within the allowed
 * schedule window, and ensures correct status constraints (PRESENT vs LATE).
 * Supports overnight shifts that cross the midnight boundary.
 *
 * SICK and EXCUSED statuses are allowed to bypass the schedule time window.
 *
 * @param schedule - The schedule details including windowStart, lateCutoff, scheduleEnd, and scheduleStart.
 * @param timezone - The timezone of the geofenced area.
 * @param referenceTime - The reference date-time object (defaults to current time).
 * @param status - The check-in status.
 * @param notes - Optional reason details (required for LATE).
 * @returns An object containing validation status and current local date/time string.
 */
export function verifyAttendanceTime(
  schedule: {
    windowStart: string;
    lateCutoff: string;
    scheduleEnd: string;
    scheduleStart: string;
  },
  timezone = "Asia/Makassar",
  referenceTime = new Date(),
  status: AttendanceStatusType,
): TimeCheckResult {
  const currentLocalTimeStr = formatInTimeZone(
    referenceTime,
    timezone,
    "HH:mm:ss",
  );
  const currentLocalDateStr = formatInTimeZone(
    referenceTime,
    timezone,
    "yyyy-MM-dd",
  );

  // Skip timing window checks for EXCUSED and SICK statuses
  if (status === AttendanceStatus.EXCUSED || status === AttendanceStatus.SICK) {
    return {
      isValid: true,
      error: null,
      currentLocalTimeStr,
      currentLocalDateStr,
    };
  }

  const windowStart = formatTimeToApi(schedule.windowStart);
  const lateCutoff = formatTimeToApi(schedule.lateCutoff);
  const scheduleEnd = formatTimeToApi(schedule.scheduleEnd);

  // Check if it's an overnight shift
  const isOvernight = scheduleEnd < windowStart;

  let activeWorkDateStr = currentLocalDateStr;
  let absoluteWindowStart: Date;
  let absoluteLateCutoff: Date;
  let absoluteScheduleEnd: Date;

  if (isOvernight) {
    // Candidates: Shift started yesterday vs shift starting today
    const yesterdayDateStr = formatInTimeZone(
      subDays(referenceTime, 1),
      timezone,
      "yyyy-MM-dd",
    );
    const tomorrowDateStr = formatInTimeZone(
      addDays(referenceTime, 1),
      timezone,
      "yyyy-MM-dd",
    );

    // Yesterday's Shift window
    const startYesterday = parseZonedDateTime(
      yesterdayDateStr,
      windowStart,
      timezone,
    );
    const endToday = parseZonedDateTime(
      currentLocalDateStr,
      scheduleEnd,
      timezone,
    );
    const cutoffToday = parseZonedDateTime(
      lateCutoff < windowStart ? currentLocalDateStr : yesterdayDateStr,
      lateCutoff,
      timezone,
    );

    // Today's Shift window
    const startToday = parseZonedDateTime(
      currentLocalDateStr,
      windowStart,
      timezone,
    );
    const endTomorrow = parseZonedDateTime(
      tomorrowDateStr,
      scheduleEnd,
      timezone,
    );
    const cutoffTomorrow = parseZonedDateTime(
      lateCutoff < windowStart ? tomorrowDateStr : currentLocalDateStr,
      lateCutoff,
      timezone,
    );

    // Check if the current time falls inside Yesterday's shift window
    if (referenceTime >= startYesterday && referenceTime < endToday) {
      activeWorkDateStr = yesterdayDateStr;
      absoluteWindowStart = startYesterday;
      absoluteLateCutoff = cutoffToday;
      absoluteScheduleEnd = endToday;
    } else {
      // Default/fall back to Today's shift window
      activeWorkDateStr = currentLocalDateStr;
      absoluteWindowStart = startToday;
      absoluteLateCutoff = cutoffTomorrow;
      absoluteScheduleEnd = endTomorrow;
    }
  } else {
    // Normal single-day shift
    absoluteWindowStart = parseZonedDateTime(
      currentLocalDateStr,
      windowStart,
      timezone,
    );
    absoluteLateCutoff = parseZonedDateTime(
      currentLocalDateStr,
      lateCutoff,
      timezone,
    );
    absoluteScheduleEnd = parseZonedDateTime(
      currentLocalDateStr,
      scheduleEnd,
      timezone,
    );
  }

  if (referenceTime < absoluteWindowStart) {
    return {
      isValid: false,
      error: `Belum masuk jam absen (mulai ${windowStart.slice(0, 5)}).`,
      currentLocalTimeStr,
      currentLocalDateStr: activeWorkDateStr,
    };
  }

  if (referenceTime >= absoluteScheduleEnd) {
    return {
      isValid: false,
      error: `Waktu absen telah berakhir (selesai ${scheduleEnd.slice(0, 5)}).`,
      currentLocalTimeStr,
      currentLocalDateStr: activeWorkDateStr,
    };
  }

  if (referenceTime >= absoluteLateCutoff) {
    // Current time is in the LATE window
    if (status !== AttendanceStatus.LATE) {
      return {
        isValid: false,
        error: `Batas waktu presensi tepat waktu telah berakhir. Anda harus mengisi presensi sebagai Terlambat.`,
        currentLocalTimeStr,
        currentLocalDateStr: activeWorkDateStr,
      };
    }
  } else {
    // Current time is in the PRESENT (on-time) window
    if (status === AttendanceStatus.LATE) {
      return {
        isValid: false,
        error: `Anda tidak dapat memilih status terlambat selama jam masuk tepat waktu.`,
        currentLocalTimeStr,
        currentLocalDateStr: activeWorkDateStr,
      };
    }
  }

  return {
    isValid: true,
    error: null,
    currentLocalTimeStr,
    currentLocalDateStr: activeWorkDateStr,
  };
}
