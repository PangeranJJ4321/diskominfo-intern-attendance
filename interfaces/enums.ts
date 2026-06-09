/**
 * Attendance status values as a const object for runtime use.
 * Mirrors the Prisma `AttendanceStatus` enum defined in `prisma/schema.prisma`.
 */
export const AttendanceStatus = {
  PRESENT: "PRESENT",
  LATE: "LATE",
  SICK: "SICK",
  EXCUSED: "EXCUSED",
  ABSENT: "ABSENT",
} as const;

/** Union type derived from the const object above. */
export type AttendanceStatusType =
  (typeof AttendanceStatus)[keyof typeof AttendanceStatus];

/** All attendance status values as a readonly array. */
export const ATTENDANCE_STATUS_VALUES = Object.values(
  AttendanceStatus,
) as readonly AttendanceStatusType[];

/** Indonesian labels for each attendance status. */
export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatusType, string> = {
  [AttendanceStatus.PRESENT]: "Hadir",
  [AttendanceStatus.LATE]: "Terlambat",
  [AttendanceStatus.SICK]: "Sakit",
  [AttendanceStatus.EXCUSED]: "Izin / Cuti",
  [AttendanceStatus.ABSENT]: "Alpa",
};

/** Tailwind CSS class strings for styled badges by status. */
export const ATTENDANCE_STATUS_STYLES: Record<AttendanceStatusType, string> = {
  [AttendanceStatus.PRESENT]:
    "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
  [AttendanceStatus.LATE]:
    "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400",
  [AttendanceStatus.SICK]:
    "bg-sky-500/10 border-sky-500/20 text-sky-600 dark:text-sky-400",
  [AttendanceStatus.EXCUSED]:
    "bg-violet-500/10 border-violet-500/20 text-violet-600 dark:text-violet-400",
  [AttendanceStatus.ABSENT]:
    "bg-destructive/10 border-destructive/20 text-destructive",
};

/** Tailwind CSS class strings for solid button backgrounds by status. */
export const ATTENDANCE_STATUS_BUTTON_STYLES: Record<
  AttendanceStatusType,
  string
> = {
  [AttendanceStatus.PRESENT]:
    "bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600/10",
  [AttendanceStatus.LATE]:
    "bg-amber-500 hover:bg-amber-600 text-white border-amber-600/10",
  [AttendanceStatus.SICK]:
    "bg-sky-500 hover:bg-sky-600 text-white border-sky-600/10",
  [AttendanceStatus.EXCUSED]:
    "bg-violet-500 hover:bg-violet-600 text-white border-violet-600/10",
  [AttendanceStatus.ABSENT]:
    "bg-destructive hover:bg-destructive/90 text-white border-destructive/10",
};

/**
 * Returns the Indonesian label for a given attendance status.
 *
 * @param status - The attendance status value.
 * @returns The Indonesian label string, or the status itself if unknown.
 */
export function getAttendanceStatusLabel(status: string): string {
  return ATTENDANCE_STATUS_LABELS[status as AttendanceStatusType] ?? status;
}

/**
 * Returns the Tailwind CSS badge style classes for a given attendance status.
 *
 * @param status - The attendance status value.
 * @returns The CSS class string, or an empty string if unknown.
 */
export function getAttendanceStatusStyles(status: string): string {
  return ATTENDANCE_STATUS_STYLES[status as AttendanceStatusType] ?? "";
}

/**
 * Returns the Tailwind CSS solid button style classes for a given attendance status.
 *
 * @param status - The attendance status value.
 * @returns The CSS class string, or an empty string if unknown.
 */
export function getAttendanceStatusButtonStyles(status: string): string {
  return ATTENDANCE_STATUS_BUTTON_STYLES[status as AttendanceStatusType] ?? "";
}
