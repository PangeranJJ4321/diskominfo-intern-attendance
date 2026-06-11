"use client";

import { useEffect, useState } from "react";
import { format, isSameMonth, isToday } from "date-fns";
import { id } from "date-fns/locale";
import { getCalendarDays } from "@/lib/date-utils";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTimeFromApi } from "@/lib/time-utils";
import { useIsMobile } from "@/hooks/use-mobile";

import { useScheduleStore } from "@/stores/schedule-store";
import { useAssignmentStore } from "@/stores/assignment-store";
import { useAttendanceStore } from "@/stores/attendance-store";
import { useHolidayStore } from "@/stores/holiday-store";
import type { ShiftAssignment } from "@/interfaces/models";
import type { UserAttendancesProps } from "@/interfaces/custom";
import {
  AttendanceStatus,
  getAttendanceStatusStyles,
} from "@/interfaces/enums";

/**
 * Renders the calendar of user attendance history for the specified user and month.
 * Data is read from granular Zustand stores: schedule-store, assignment-store,
 * attendance-store, and holiday-store. Zustand reactivity handles re-renders.
 *
 * @param {UserAttendancesProps} props - The component props.
 * @returns {React.JSX.Element} The rendered user attendance calendar.
 */
export default function UserAttendances({
  userId,
  currentMonth,
  onDayClick,
}: UserAttendancesProps) {
  // ── Granular Zustand stores ──
  const schedules = useScheduleStore((s) => s.schedules);
  const fetchSchedules = useScheduleStore((s) => s.fetchSchedules);
  const assignments = useAssignmentStore((s) => s.assignments);
  const fetchAssignments = useAssignmentStore((s) => s.fetchAssignments);
  const attendances = useAttendanceStore((s) => s.attendances);
  const fetchAttendances = useAttendanceStore((s) => s.fetchAttendances);
  const holidays = useHolidayStore((s) => s.holidays);
  const fetchHolidays = useHolidayStore((s) => s.fetchHolidays);

  const isMobile = useIsMobile();
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsClient(true);
    }, 0);
    let cancelled = false;

    // Compute date range from the calendar grid to limit data fetching
    const calendarDays = isMobile
      ? (() => {
          const start = new Date(currentMonth);
          start.setDate(currentMonth.getDate() - currentMonth.getDay());
          const end = new Date(start);
          end.setDate(start.getDate() + 6);
          return { start, end };
        })()
      : (() => {
          const allDays = getCalendarDays(currentMonth);
          return {
            start: allDays[0],
            end: allDays[allDays.length - 1],
          };
        })();

    const formatDate = (d: Date) => format(d, "yyyy-MM-dd");
    const startDate = formatDate(calendarDays.start);
    const endDate = formatDate(calendarDays.end);

    async function loadData() {
      setLoading(true);
      try {
        const relevantDays = Array.from({ length: 7 }, (_, i) => i);
        await Promise.all([
          fetchSchedules(1000, relevantDays),
          fetchAssignments(1000, startDate, endDate),
          fetchAttendances(userId, 1000, startDate, endDate),
          fetchHolidays(1000, startDate, endDate),
        ]);
        if (!cancelled) {
          setLoading(false);
        }
      } catch (err) {
        console.error("Gagal memuat data presensi pengguna", err);
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    void loadData();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    userId,
    currentMonth,
    isMobile,
    fetchSchedules,
    fetchAssignments,
    fetchAttendances,
    fetchHolidays,
  ]);

  if (!isClient || loading) {
    if (isMobile) {
      return (
        <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden divide-y divide-border">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3.5 bg-card"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="size-12 rounded-xl" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-16" />
                  <Skeleton className="h-4.5 w-24" />
                </div>
              </div>
              <Skeleton className="h-9 w-28 rounded-lg" />
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
        {/* Skeleton Header */}
        <div className="grid grid-cols-7 border-b border-border bg-muted/20 py-3.5 px-2 gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-12 mx-auto" />
          ))}
        </div>
        {/* Skeleton Cells */}
        <div className="grid grid-cols-7 gap-px bg-border/30">
          {/* First 7 cells (always visible) */}
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="flex min-h-28 flex-col justify-between p-2.5 bg-card"
            >
              <div className="flex justify-end">
                <Skeleton className="size-6.5 rounded-full" />
              </div>
              <div className="space-y-1.5 mt-2">
                <Skeleton className="h-6 w-full rounded-lg" />
              </div>
            </div>
          ))}
          {/* Additional 7 cells (hidden on mobile, visible on desktop) */}
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={`extra-${i}`}
              className="hidden md:flex min-h-28 flex-col justify-between p-2.5 bg-card"
            >
              <div className="flex justify-end w-full">
                <Skeleton className="size-6.5 rounded-full ml-auto" />
              </div>
              <div className="space-y-1.5 mt-2 w-full">
                <Skeleton className="h-6 w-full rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Generate Calendar Grid
  const calendarDays = isMobile
    ? (() => {
        const start = new Date(currentMonth);
        start.setDate(currentMonth.getDate() - currentMonth.getDay());
        return Array.from({ length: 7 }).map((_, i) => {
          const d = new Date(start);
          d.setDate(start.getDate() + i);
          return d;
        });
      })()
    : getCalendarDays(currentMonth);

  const dayLabels = [
    { short: "Min", long: "Minggu" },
    { short: "Sen", long: "Senin" },
    { short: "Sel", long: "Selasa" },
    { short: "Rab", long: "Rabu" },
    { short: "Kam", long: "Kamis" },
    { short: "Jum", long: "Jumat" },
    { short: "Sab", long: "Sabtu" },
  ];

  // Helper: Get active shift assignments for a specific date
  const getActiveAssignmentsForDate = (date: Date): ShiftAssignment[] => {
    const formattedDate = format(date, "yyyy-MM-dd");
    return assignments.filter((a) => {
      if (a.intern?.userId !== userId) return false;
      const startOk = a.startDate <= formattedDate;
      const endOk = !a.endDate || a.endDate >= formattedDate;
      return startOk && endOk;
    });
  };

  // Today representation for past date comparison
  const todayStr = format(new Date(), "yyyy-MM-dd");

  if (isMobile) {
    return (
      <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden divide-y divide-border">
        {calendarDays.map((calendarDay, index) => {
          const formattedDate = format(calendarDay, "yyyy-MM-dd");
          const isTodayDate = isToday(calendarDay);
          const isWeekend =
            calendarDay.getDay() === 0 || calendarDay.getDay() === 6;

          const isDayHoliday = holidays.some((h) => h.date === formattedDate);
          const holidayInfo = holidays.find((h) => h.date === formattedDate);

          // Find active shift assignments for this day
          const activeAssigns = getActiveAssignmentsForDate(calendarDay);

          // Get schedules for those shifts on this day of week (filtered by holiday work rules)
          const normalSchedules = activeAssigns
            .flatMap((assign) =>
              schedules.filter(
                (s) =>
                  s.shiftId === assign.shiftId &&
                  s.dayOfWeek === calendarDay.getDay(),
              ),
            )
            .filter((s) => !isDayHoliday || s.shift?.workOnHolidays);

          // Get schedules from attendance records on this date (e.g. from soft-deleted shifts/schedules)
          const dayAttendances = attendances.filter(
            (a) => a.intern?.userId === userId && a.date === formattedDate,
          );

          const daySchedules = [...normalSchedules];

          for (const att of dayAttendances) {
            if (att.schedule) {
              const alreadyExists = daySchedules.some(
                (s) => s.id === att.scheduleId,
              );
              if (!alreadyExists) {
                daySchedules.push({
                  ...att.schedule,
                  windowStart: formatTimeFromApi(att.schedule.windowStart),
                  scheduleStart: formatTimeFromApi(att.schedule.scheduleStart),
                  lateCutoff: formatTimeFromApi(att.schedule.lateCutoff),
                  scheduleEnd: formatTimeFromApi(att.schedule.scheduleEnd),
                });
              }
            }
          }

          // Sort schedules from earliest to latest scheduleStart
          daySchedules.sort((a, b) =>
            a.scheduleStart.localeCompare(b.scheduleStart),
          );

          return (
            <div
              key={`${formattedDate}-${index}`}
              className={`flex items-center justify-between p-3.5 transition-all bg-card ${
                isTodayDate
                  ? "bg-primary/5 border-l-4 border-primary"
                  : "border-l-4 border-transparent"
              } ${isWeekend ? "bg-muted/5" : ""}`}
            >
              {/* Left Side: Date info */}
              <div className="flex items-center gap-3">
                <div
                  className={`flex flex-col items-center justify-center size-12 rounded-xl border ${
                    isTodayDate
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/30 border-border"
                  }`}
                >
                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider ${
                      isTodayDate
                        ? "text-primary-foreground/90"
                        : "text-muted-foreground"
                    }`}
                  >
                    {format(calendarDay, "EEE", { locale: id })}
                  </span>
                  <span className="text-sm font-extrabold leading-none">
                    {format(calendarDay, "d")}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-muted-foreground">
                    {format(calendarDay, "MMMM yyyy", { locale: id })}
                  </span>
                  {activeAssigns.length > 0 && daySchedules.length > 0 && (
                    <span className="text-[10px] w-fit font-bold text-primary px-1.5 py-0.5 rounded-md bg-primary/10 mt-1">
                      Shift Aktif
                    </span>
                  )}
                </div>
              </div>

              {/* Right Side: Badges / Schedules */}
              <div className="flex flex-col items-end gap-1.5">
                {daySchedules.length > 0 ? (
                  daySchedules.map((schedule, idx) => {
                    const attendance = attendances.find(
                      (a) =>
                        a.intern?.userId === userId &&
                        a.scheduleId === schedule.id &&
                        a.date === formattedDate,
                    );

                    if (attendance) {
                      const status = attendance.status;
                      let statusStyles = "";
                      let statusLabel = "";

                      switch (status) {
                        case AttendanceStatus.PRESENT:
                          statusStyles = getAttendanceStatusStyles(status);
                          statusLabel = `Hadir (${attendance.attendanceTime || "N/A"})`;
                          break;
                        case AttendanceStatus.LATE:
                          statusStyles = getAttendanceStatusStyles(status);
                          statusLabel = `Terlambat (${attendance.attendanceTime || "N/A"})`;
                          break;
                        case AttendanceStatus.SICK:
                          statusStyles = getAttendanceStatusStyles(status);
                          statusLabel = "Sakit";
                          break;
                        case AttendanceStatus.EXCUSED:
                          statusStyles = getAttendanceStatusStyles(status);
                          statusLabel = "Izin / Cuti";
                          break;
                        case AttendanceStatus.ABSENT:
                          statusStyles = getAttendanceStatusStyles(status);
                          statusLabel = "Alpa";
                          break;
                      }

                      return (
                        <div
                          key={`${schedule.id}-${idx}`}
                          onClick={() =>
                            onDayClick?.(calendarDay, schedule, attendance)
                          }
                          className={`text-xs font-bold border rounded-lg px-2.5 py-1.5 cursor-pointer transition-all hover:brightness-95 ${statusStyles}`}
                          title={`${schedule.name}: ${statusLabel}`}
                        >
                          {statusLabel}
                        </div>
                      );
                    }

                    const isPastDate = formattedDate < todayStr;
                    if (isPastDate) {
                      return (
                        <div
                          key={`${schedule.id}-${idx}`}
                          onClick={() =>
                            onDayClick?.(calendarDay, schedule, null)
                          }
                          className="text-xs font-bold bg-destructive/10 border-dashed border-destructive/20 text-destructive border rounded-lg px-2.5 py-1.5 cursor-pointer transition-all hover:bg-destructive/15"
                          title="Alpa (Tidak melakukan presensi)"
                        >
                          Alpa (Sistem)
                        </div>
                      );
                    } else {
                      return (
                        <div
                          key={`${schedule.id}-${idx}`}
                          onClick={() =>
                            onDayClick?.(calendarDay, schedule, null)
                          }
                          className="text-xs font-medium bg-muted border-border text-muted-foreground border rounded-lg px-2.5 py-1.5 cursor-pointer transition-all hover:bg-muted/80"
                          title={`Terjadwal: ${schedule.scheduleStart}`}
                        >
                          {isTodayDate
                            ? "Belum Absen"
                            : `Jadwal: ${schedule.scheduleStart}`}
                        </div>
                      );
                    }
                  })
                ) : isDayHoliday ? (
                  <div
                    className="text-[10px] font-bold text-red-500 bg-red-500/10 border border-red-500/10 rounded-lg px-2.5 py-1.5"
                    title={holidayInfo?.description}
                  >
                    Libur: {holidayInfo?.description}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground/60 italic px-2.5 py-1">
                    Tidak ada jadwal
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
      {/* Calendar Header Days */}
      <div className="grid grid-cols-7 border-b border-border bg-muted/20 text-center text-xs font-bold tracking-wider text-muted-foreground uppercase py-3.5">
        {dayLabels.map((dayLabel, index) => (
          <div
            key={dayLabel.short}
            className={index === 0 || index === 6 ? "text-destructive/80" : ""}
          >
            <span className="hidden sm:inline">{dayLabel.long}</span>
            <span className="sm:hidden">{dayLabel.short}</span>
          </div>
        ))}
      </div>

      {/* Calendar Grid Cells */}
      <div className="grid grid-cols-7 gap-px bg-border/30">
        {calendarDays.map((calendarDay, index) => {
          const formattedDate = format(calendarDay, "yyyy-MM-dd");
          const isCurrentMonth = isMobile
            ? true
            : isSameMonth(calendarDay, currentMonth);
          const isTodayDate = isToday(calendarDay);
          const isWeekend =
            calendarDay.getDay() === 0 || calendarDay.getDay() === 6;

          const isDayHoliday = holidays.some((h) => h.date === formattedDate);
          const holidayInfo = holidays.find((h) => h.date === formattedDate);

          // Find active shift assignments for this day
          const activeAssigns = getActiveAssignmentsForDate(calendarDay);

          // Get schedules for those shifts on this day of week (filtered by holiday work rules)
          const normalSchedules = activeAssigns
            .flatMap((assign) =>
              schedules.filter(
                (s) =>
                  s.shiftId === assign.shiftId &&
                  s.dayOfWeek === calendarDay.getDay(),
              ),
            )
            .filter((s) => !isDayHoliday || s.shift?.workOnHolidays);

          // Get schedules from attendance records on this date (e.g. from soft-deleted shifts/schedules)
          const dayAttendances = attendances.filter(
            (a) => a.intern?.userId === userId && a.date === formattedDate,
          );

          const daySchedules = [...normalSchedules];

          for (const att of dayAttendances) {
            if (att.schedule) {
              const alreadyExists = daySchedules.some(
                (s) => s.id === att.scheduleId,
              );
              if (!alreadyExists) {
                daySchedules.push({
                  ...att.schedule,
                  windowStart: formatTimeFromApi(att.schedule.windowStart),
                  scheduleStart: formatTimeFromApi(att.schedule.scheduleStart),
                  lateCutoff: formatTimeFromApi(att.schedule.lateCutoff),
                  scheduleEnd: formatTimeFromApi(att.schedule.scheduleEnd),
                });
              }
            }
          }

          // Sort schedules from earliest to latest scheduleStart
          daySchedules.sort((a, b) =>
            a.scheduleStart.localeCompare(b.scheduleStart),
          );

          return (
            <div
              key={`${formattedDate}-${index}`}
              className={`flex min-h-28 flex-col justify-between p-2 sm:p-2.5 transition-all bg-card ${
                !isCurrentMonth
                  ? "bg-muted/10 text-muted-foreground/45 select-none pointer-events-none"
                  : ""
              } ${isWeekend && isCurrentMonth ? "bg-muted/5" : ""}`}
            >
              {/* Date Indicator */}
              <div className="flex justify-between items-start">
                <span className="text-xs font-semibold text-muted-foreground/60 hidden sm:inline">
                  {activeAssigns.length > 0 &&
                    daySchedules.length > 0 &&
                    isCurrentMonth && (
                      <span className="text-xs px-1.5 py-0.5 rounded-md bg-primary/5 text-primary/80 font-medium">
                        Shift Aktif
                      </span>
                    )}
                </span>
                <span
                  className={`flex size-6.5 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    isTodayDate
                      ? "bg-primary text-primary-foreground shadow-sm font-extrabold scale-105"
                      : isWeekend && isCurrentMonth
                        ? "text-destructive"
                        : "text-foreground/80"
                  }`}
                >
                  {format(calendarDay, "d")}
                </span>
              </div>

              {/* Attendance Badges / Schedule */}
              <div className="flex flex-col gap-1.5 overflow-hidden mt-2">
                {isCurrentMonth && (
                  <>
                    {daySchedules.length > 0 ? (
                      daySchedules.map((schedule, idx) => {
                        // Find attendance record
                        const attendance = attendances.find(
                          (a) =>
                            a.intern?.userId === userId &&
                            a.scheduleId === schedule.id &&
                            a.date === formattedDate,
                        );

                        // If attendance exists, show status
                        if (attendance) {
                          const status = attendance.status;
                          let statusStyles = "";
                          let statusLabel = "";

                          switch (status) {
                            case AttendanceStatus.PRESENT:
                              statusStyles = getAttendanceStatusStyles(status);
                              statusLabel = isMobile
                                ? "Hadir"
                                : `Hadir (${attendance.attendanceTime || "N/A"})`;
                              break;
                            case AttendanceStatus.LATE:
                              statusStyles = getAttendanceStatusStyles(status);
                              statusLabel = isMobile
                                ? "Terlambat"
                                : `Terlambat (${attendance.attendanceTime || "N/A"})`;
                              break;
                            case AttendanceStatus.SICK:
                              statusStyles = getAttendanceStatusStyles(status);
                              statusLabel = "Sakit";
                              break;
                            case AttendanceStatus.EXCUSED:
                              statusStyles = getAttendanceStatusStyles(status);
                              statusLabel = isMobile ? "Izin" : "Izin / Cuti";
                              break;
                            case AttendanceStatus.ABSENT:
                              statusStyles = getAttendanceStatusStyles(status);
                              statusLabel = "Alpa";
                              break;
                          }

                          return (
                            <div
                              key={`${schedule.id}-${idx}`}
                              onClick={() =>
                                onDayClick?.(calendarDay, schedule, attendance)
                              }
                              className={`truncate text-xs font-bold border rounded-lg px-2 py-1 cursor-pointer transition-all hover:brightness-95 ${statusStyles}`}
                              title={`${schedule.name}: ${statusLabel}`}
                            >
                              {statusLabel}
                            </div>
                          );
                        }

                        // No attendance record yet
                        const isPastDate = formattedDate < todayStr;
                        if (isPastDate) {
                          // Past date with schedule but no clock-in -> Auto ABSENT
                          return (
                            <div
                              key={`${schedule.id}-${idx}`}
                              onClick={() =>
                                onDayClick?.(calendarDay, schedule, null)
                              }
                              className="truncate text-xs font-bold bg-destructive/10 border-dashed border-destructive/20 text-destructive border rounded-lg px-2 py-1 cursor-pointer transition-all hover:bg-destructive/15"
                              title="Alpa (Tidak melakukan presensi)"
                            >
                              {isMobile ? "Alpa" : "Alpa (Sistem)"}
                            </div>
                          );
                        } else {
                          // Today or future date
                          return (
                            <div
                              key={`${schedule.id}-${idx}`}
                              onClick={() =>
                                onDayClick?.(calendarDay, schedule, null)
                              }
                              className="truncate text-xs font-medium bg-muted border-border text-muted-foreground border rounded-lg px-2 py-1 cursor-pointer transition-all hover:bg-muted/80"
                              title={`Terjadwal: ${schedule.scheduleStart}`}
                            >
                              {isMobile
                                ? schedule.scheduleStart
                                : isTodayDate
                                  ? "Belum Absen"
                                  : `Jadwal: ${schedule.scheduleStart}`}
                            </div>
                          );
                        }
                      })
                    ) : isDayHoliday ? (
                      <div
                        className="text-[10px] font-bold text-red-500 bg-red-500/10 border border-red-500/10 rounded-lg px-2 py-1 text-center truncate"
                        title={holidayInfo?.description}
                      >
                        Libur: {holidayInfo?.description}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground/60 italic text-center py-1">
                        Tidak ada jadwal
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
