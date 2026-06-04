"use client";

import { useEffect, useMemo, useState } from "react";
import { format, isSameDay, isSameMonth, isToday, startOfDay } from "date-fns";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAttendanceContext } from "../context/attendance-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AttendanceStatus = "PRESENT" | "LATE" | "EXCUSED" | "ABSENT";

interface AttendanceRecord {
  id: string;
  date: Date;
  status: AttendanceStatus;
  attendanceTime?: Date;
  notes?: string;
  createdAt: Date;
  agencySchedule: {
    name: string;
    agencyScheduleStart: string;
  };
}

// Minimal type representing the raw fetched attendance
interface RawAttendance {
  id: string;
  internId: string;
  agencyScheduleId: string;
  date: string;
  attendanceTime: string | null;
  status: AttendanceStatus;
  notes: string | null;
  createdAt: string;
}

// Minimal type representing the raw fetched schedule
interface RawSchedule {
  id: string;
  name: string;
  agencyScheduleStart: string;
  dayOfWeek?: number; // 0 (Sunday) to 6 (Saturday)
}

const DAY_LABELS = [
  { short: "Min", long: "Minggu" },
  { short: "Sen", long: "Senin" },
  { short: "Sel", long: "Selasa" },
  { short: "Rab", long: "Rabu" },
  { short: "Kam", long: "Kamis" },
  { short: "Jum", long: "Jumat" },
  { short: "Sab", long: "Sabtu" },
];

const STATUS_STYLES: Record<AttendanceStatus, string> = {
  PRESENT: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  LATE: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  EXCUSED: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  ABSENT: "bg-destructive/15 text-destructive dark:text-red-400",
};

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  PRESENT: "Hadir",
  LATE: "Terlambat",
  EXCUSED: "Izin",
  ABSENT: "Alpa",
};

function formatMonthLabel(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatScheduleTime(value: string): string {
  return value.length >= 5 ? value.slice(0, 5) : value;
}

interface AttendanceHistoryCardProps {
  intern: {
    id: string;
    agencyId: string;
    startedAt?: string | null;
    finishedAt?: string | null;
  };
}

/**
 * Renders the intern attendance history calendar.
 */
export function AttendanceHistoryCard({
  intern,
}: AttendanceHistoryCardProps): React.JSX.Element {
  const { updates } = useAttendanceContext();
  const [currentMonth, setCurrentMonth] = useState<Date>(() => new Date());
  const [rawAttendances, setRawAttendances] = useState<RawAttendance[]>([]);
  const [schedules, setSchedules] = useState<RawSchedule[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const attendanceUpdateVersion = updates[intern.id] ?? 0;

  const nextMonth = (): void => {
    setCurrentMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() + 1, 1),
    );
  };

  const prevMonth = (): void => {
    setCurrentMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() - 1, 1),
    );
  };

  const goToToday = (): void => {
    setCurrentMonth(new Date());
  };

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
  startDate.setDate(startDate.getDate() - startDate.getDay());

  const endDate = new Date(monthEnd);
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

  // Use primitive string representations for useEffect & useMemo dependencies
  const startDateIso = startDate.toISOString();
  const endDateIso = endDate.toISOString();

  const calendarDays: Date[] = useMemo(() => {
    const days: Date[] = [];
    const day = new Date(startDateIso);
    const end = new Date(endDateIso);

    while (day <= end) {
      days.push(new Date(day));
      day.setDate(day.getDate() + 1);
    }
    return days;
  }, [startDateIso, endDateIso]);

  useEffect(() => {
    let isActive = true;

    async function fetchData() {
      setIsLoading(true);
      try {
        const [attendanceRes, schedulesRes] = await Promise.all([
          fetch(
            `/api/attendances?internId=${intern.id}&startDate=${startDateIso}&endDate=${endDateIso}&limit=100`,
          ),
          fetch(`/api/agency-schedules?agencyId=${intern.agencyId}&limit=100`),
        ]);

        if (!isActive) return;

        if (!attendanceRes.ok || !schedulesRes.ok) {
          throw new Error("Gagal mengambil data dari server");
        }

        const attendanceData = await attendanceRes.json();
        const schedulesData = await schedulesRes.json();

        if (!isActive) return;

        setRawAttendances(attendanceData.data || []);
        setSchedules(schedulesData.data || []);
      } catch (error) {
        console.error("Error fetching attendance history:", error);
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    fetchData();

    return () => {
      isActive = false;
    };
  }, [
    intern.id,
    intern.agencyId,
    startDateIso,
    endDateIso,
    attendanceUpdateVersion,
  ]);

  // Combine raw attendances with schedule information and fill missing past days as ABSENT
  const attendanceRecords: AttendanceRecord[] = useMemo(() => {
    const scheduleMap = schedules.reduce<Record<string, RawSchedule>>(
      (acc, schedule) => {
        acc[schedule.id] = schedule;
        return acc;
      },
      {},
    );

    const recordMap = new Map<string, AttendanceRecord>();

    // Parse existing records
    rawAttendances.forEach((record) => {
      const dateStr = format(new Date(record.date), "yyyy-MM-dd");
      const key = `${dateStr}-${record.agencyScheduleId}`;

      recordMap.set(key, {
        id: record.id,
        date: new Date(record.date),
        status: record.status,
        attendanceTime: record.attendanceTime
          ? new Date(record.attendanceTime)
          : undefined,
        notes: record.notes || undefined,
        createdAt: new Date(record.createdAt),
        agencySchedule: {
          name: scheduleMap[record.agencyScheduleId]?.name || "Jadwal",
          agencyScheduleStart:
            scheduleMap[record.agencyScheduleId]?.agencyScheduleStart ||
            "00:00",
        },
      });
    });

    const allRecords = Array.from(recordMap.values());
    const today = startOfDay(new Date());

    const internStartDate = intern.startedAt
      ? startOfDay(new Date(intern.startedAt))
      : null;
    const internEndDate = intern.finishedAt
      ? startOfDay(new Date(intern.finishedAt))
      : null;

    // Generate synthetic "ABSENT" records for missing past attendances
    if (schedules.length > 0) {
      calendarDays.forEach((day) => {
        const dayStart = startOfDay(day);

        // 1. Must be strictly before today
        if (dayStart.getTime() > today.getTime()) return;

        // 2. Must be within the intern's active duration bounds
        if (internStartDate && dayStart.getTime() < internStartDate.getTime())
          return;
        if (internEndDate && dayStart.getTime() > internEndDate.getTime())
          return;

        const dateStr = format(dayStart, "yyyy-MM-dd");
        const currentDayOfWeek = dayStart.getDay(); // 0-6

        schedules.forEach((schedule) => {
          // 3. Must check if this schedule actually applies to this day of the week
          const appliesToDay =
            schedule.dayOfWeek === undefined ||
            schedule.dayOfWeek === currentDayOfWeek;

          if (appliesToDay) {
            const key = `${dateStr}-${schedule.id}`;

            if (!recordMap.has(key)) {
              allRecords.push({
                id: `absent-${key}`, // unique synthetic ID
                date: day,
                status: "ABSENT",
                notes: "Tanpa Keterangan",
                createdAt: day,
                agencySchedule: {
                  name: schedule.name,
                  agencyScheduleStart: schedule.agencyScheduleStart,
                },
              });
            }
          }
        });
      });
    }

    return allRecords;
  }, [
    rawAttendances,
    schedules,
    calendarDays,
    intern.startedAt,
    intern.finishedAt,
  ]);

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col items-start justify-between gap-4 pb-6 sm:flex-row sm:items-center">
        <div className="space-y-1">
          <CardTitle className="text-xl">Riwayat Kehadiran</CardTitle>
          <p className="text-sm text-muted-foreground">
            Pantau catatan absensi Anda berdasarkan jadwal yang tersimpan.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="hidden sm:inline-flex"
            type="button"
          >
            Bulan Ini
          </Button>
          <div className="flex items-center gap-1 rounded-md border bg-background p-1 shadow-sm">
            <Button
              variant="ghost"
              size="icon"
              onClick={prevMonth}
              className="size-7"
              type="button"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <div className="w-36 text-center text-sm font-semibold">
              {formatMonthLabel(currentMonth)}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={nextMonth}
              className="size-7"
              type="button"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="mb-4 flex items-center justify-between gap-3 text-sm text-muted-foreground">
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" /> Memuat catatan...
            </span>
          ) : null}
        </div>

        <div className="overflow-hidden rounded-xl border">
          <div className="grid grid-cols-7 border-b bg-muted/30 text-center text-sm font-medium text-muted-foreground">
            {DAY_LABELS.map((dayLabel) => (
              <div
                key={dayLabel.short}
                className="py-3 text-xs uppercase tracking-wider"
              >
                <span className="hidden sm:inline">{dayLabel.long}</span>
                <span className="sm:hidden">{dayLabel.short}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-px bg-border">
            {calendarDays.map((calendarDay, index) => {
              const dayRecords = attendanceRecords
                .filter((record) => isSameDay(record.date, calendarDay))
                .sort((firstRecord, secondRecord) => {
                  const firstStart =
                    firstRecord.agencySchedule.agencyScheduleStart;
                  const secondStart =
                    secondRecord.agencySchedule.agencyScheduleStart;

                  return (
                    firstStart.localeCompare(secondStart) ||
                    firstRecord.createdAt.getTime() -
                      secondRecord.createdAt.getTime()
                  );
                });
              const isCurrentMonth = isSameMonth(calendarDay, currentMonth);
              const isTodayDate = isToday(calendarDay);

              return (
                <div
                  key={`${calendarDay.toISOString()}-${index}`}
                  className={`relative flex min-h-28 flex-col gap-1 bg-background p-1.5 transition-colors hover:bg-muted/30 sm:p-2 ${
                    !isCurrentMonth
                      ? "bg-muted/10 text-muted-foreground/50"
                      : ""
                  }`}
                >
                  <div className="mb-1 flex justify-end">
                    <span
                      className={`flex size-6 items-center justify-center rounded-full text-xs font-medium sm:size-7 sm:text-sm ${
                        isTodayDate ? "bg-primary text-primary-foreground" : ""
                      }`}
                    >
                      {format(calendarDay, "d")}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1 overflow-y-auto">
                    {dayRecords.map((record) => {
                      const statusStyle = STATUS_STYLES[record.status];
                      const statusLabel = STATUS_LABELS[record.status];
                      const timeLabel = record.attendanceTime
                        ? format(record.attendanceTime, "HH:mm")
                        : formatScheduleTime(
                            record.agencySchedule.agencyScheduleStart,
                          );

                      return (
                        <div
                          key={record.id}
                          className={`flex flex-col rounded-md px-1.5 py-1 text-[10px] font-medium sm:text-xs ${statusStyle}`}
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span>{record.agencySchedule.name}</span>
                            <span>{timeLabel}</span>
                          </div>
                          <span className="opacity-90">
                            {statusLabel}
                            {record.notes ? ` • ${record.notes}` : ""}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-xs font-medium text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="size-3 rounded-sm bg-emerald-500/20" />
            Hadir
          </div>
          <div className="flex items-center gap-1.5">
            <div className="size-3 rounded-sm bg-amber-500/20" />
            Terlambat
          </div>
          <div className="flex items-center gap-1.5">
            <div className="size-3 rounded-sm bg-blue-500/20" />
            Izin
          </div>
          <div className="flex items-center gap-1.5">
            <div className="size-3 rounded-sm bg-destructive/20" />
            Alpa
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
