import { format } from "date-fns";
import { id } from "date-fns/locale";

/**
 * Formats a date string into a localized Indonesian date (medium style).
 *
 * @param dateStr - The ISO date string or null.
 * @returns The formatted date string, or "—" if null.
 */
export function formatDateIndonesian(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
  }).format(new Date(dateStr));
}

/**
 * Parses a local date string (YYYY-MM-DD) and time string (HH:mm:ss or HH:mm)
 * into a Date object using local time fields (no timezone offset).
 *
 * @param dateStr - The date string in YYYY-MM-DD format.
 * @param timeStr - The time string in HH:mm:ss or HH:mm format.
 * @returns A Date object representing the local date and time.
 */
export function parseDateTimeLocal(dateStr: string, timeStr: string): Date {
  const [yyyy, mm, dd] = dateStr.split("-").map(Number);
  const [hh, min, sec] = timeStr.split(":").map(Number);
  return new Date(yyyy, mm - 1, dd, hh, min, sec || 0, 0);
}

/**
 * Generates a list of Dates for a monthly calendar grid, including padding days
 * from the previous and next months to complete the start/end weeks.
 *
 * @param currentMonth The month to generate the calendar grid for
 * @returns Array of Date objects representing the grid
 */
export function getCalendarDays(currentMonth: Date): Date[] {
  const monthStart = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1,
  );
  const monthEnd = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0,
  );

  const startDate = new Date(monthStart);
  startDate.setDate(startDate.getDate() - startDate.getDay()); // Start of first week

  const endDate = new Date(monthEnd);
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay())); // End of last week

  const calendarDays: Date[] = [];
  const day = new Date(startDate);
  while (day <= endDate) {
    calendarDays.push(new Date(day));
    day.setDate(day.getDate() + 1);
  }
  return calendarDays;
}

/**
 * Parses a date string formatted as YYYY-MM-DD locally to avoid timezone shifts.
 *
 * @param str The local date string formatted as YYYY-MM-DD
 * @returns Date object representing the local date
 */
export function parseDateLocal(str: string): Date {
  const [yyyy, mm, dd] = str.split("-").map(Number);
  return new Date(yyyy, mm - 1, dd);
}

/**
 * Formats a weekly range starting from the week of the given date.
 *
 * @param date The reference date within the week
 * @returns The formatted weekly range string
 */
export function formatWeekRange(date: Date): string {
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay());

  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  const startDay = format(start, "d");
  const endDay = format(end, "d");
  const startMonth = format(start, "MMM", { locale: id });
  const endMonth = format(end, "MMM", { locale: id });
  const startYear = format(start, "yyyy");
  const endYear = format(end, "yyyy");

  if (startYear !== endYear) {
    return `${startDay} ${startMonth} ${startYear} - ${endDay} ${endMonth} ${endYear}`;
  }
  if (startMonth !== endMonth) {
    return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${startYear}`;
  }
  return `${startDay} - ${endDay} ${startMonth} ${startYear}`;
}
