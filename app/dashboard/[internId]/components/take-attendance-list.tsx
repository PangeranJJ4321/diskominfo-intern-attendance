"use client";

import { useEffect, useMemo, useRef } from "react";
import { format, subDays } from "date-fns";
import { AlertCircle, UserCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useScheduleStore } from "@/stores/schedule-store";
import { useAssignmentStore } from "@/stores/assignment-store";
import { useHolidayStore } from "@/stores/holiday-store";
import { useAttendanceStore } from "@/stores/attendance-store";
import type { Schedule } from "@/interfaces/models";
import type { TakeAttendanceListProps } from "@/interfaces/dashboard";
import TakeAttendanceCard from "./take-attendance-card";

/**
 * Renders the list of attendance cards for the user's scheduled shifts of the day.
 * Master data (schedules, assignments, holidays, attendances, face status) are
 * read from granular Zustand stores to prevent prop drilling.
 *
 * @returns The rendered list of cards.
 */
export default function TakeAttendanceList({
  userId,
  userName,
  agencyRule,
}: TakeAttendanceListProps) {
  // ── Granular Zustand stores ──
  const schedules = useScheduleStore((s) => s.schedules);
  const fetchSchedules = useScheduleStore((s) => s.fetchSchedules);
  const assignments = useAssignmentStore((s) => s.assignments);
  const fetchAssignments = useAssignmentStore((s) => s.fetchAssignments);
  const holidays = useHolidayStore((s) => s.holidays);
  const fetchHolidays = useHolidayStore((s) => s.fetchHolidays);
  const fetchAttendances = useAttendanceStore((s) => s.fetchAttendances);
  const checkFaceRegistration = useAttendanceStore(
    (s) => s.checkFaceRegistration,
  );

  const initRef = useRef(false);

  // ── Derived date strings ──
  const todayDateStr = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);
  const yesterdayDateStr = useMemo(
    () => format(subDays(new Date(), 1), "yyyy-MM-dd"),
    [],
  );

  const todayDayOfWeek = useMemo(() => new Date().getDay(), []);
  const yesterdayDayOfWeek = useMemo(() => subDays(new Date(), 1).getDay(), []);

  // ── Fetch all master data once on mount ──
  useEffect(() => {
    if (!userId || initRef.current) return;
    initRef.current = true;

    const relevantDays = [...new Set([todayDayOfWeek, yesterdayDayOfWeek])];

    void fetchSchedules(1000, relevantDays);
    void fetchAssignments(1000, yesterdayDateStr, todayDateStr);
    void fetchHolidays(1000, yesterdayDateStr, todayDateStr);
    void fetchAttendances(userId, 1000, yesterdayDateStr, todayDateStr);
    void checkFaceRegistration(userId);
  }, [
    userId,
    fetchSchedules,
    fetchAssignments,
    fetchHolidays,
    fetchAttendances,
    checkFaceRegistration,
    todayDateStr,
    yesterdayDateStr,
    todayDayOfWeek,
    yesterdayDayOfWeek,
  ]);

  // ── Filter active schedules for today (including active yesterday overnight shifts) ──
  const sortedSchedulesWithWorkDates = useMemo(() => {
    const now = new Date();
    const currentLocalTimeStr = format(now, "HH:mm:ss");

    const assignmentsYesterday = assignments.filter((a) => {
      if (a.intern?.userId !== userId) return false;
      return (
        a.startDate <= yesterdayDateStr &&
        (!a.endDate || a.endDate >= yesterdayDateStr)
      );
    });

    const assignmentsToday = assignments.filter((a) => {
      if (a.intern?.userId !== userId) return false;
      return (
        a.startDate <= todayDateStr && (!a.endDate || a.endDate >= todayDateStr)
      );
    });

    const activeShiftIdsYesterday = assignmentsYesterday.map((a) => a.shiftId);
    const activeShiftIdsToday = assignmentsToday.map((a) => a.shiftId);

    const activeList: { schedule: Schedule; workDate: string }[] = [];

    // Check yesterday's overnight schedules that are still running today
    const yesterdayHols = holidays.some((h) => h.date === yesterdayDateStr);
    schedules.forEach((s) => {
      const isOvernight = s.scheduleEnd < s.windowStart;
      if (
        isOvernight &&
        activeShiftIdsYesterday.includes(s.shiftId) &&
        s.dayOfWeek === yesterdayDayOfWeek
      ) {
        const allowedYesterday = !yesterdayHols || s.shift?.workOnHolidays;
        if (allowedYesterday) {
          if (currentLocalTimeStr < s.scheduleEnd) {
            activeList.push({
              schedule: s,
              workDate: yesterdayDateStr,
            });
          }
        }
      }
    });

    // Check today's schedules
    const todayHols = holidays.some((h) => h.date === todayDateStr);
    schedules.forEach((s) => {
      if (
        activeShiftIdsToday.includes(s.shiftId) &&
        s.dayOfWeek === todayDayOfWeek
      ) {
        const allowedToday = !todayHols || s.shift?.workOnHolidays;
        if (allowedToday) {
          activeList.push({
            schedule: s,
            workDate: todayDateStr,
          });
        }
      }
    });

    return activeList.sort((a, b) =>
      a.schedule.scheduleStart.localeCompare(b.schedule.scheduleStart),
    );
  }, [
    schedules,
    assignments,
    userId,
    todayDateStr,
    yesterdayDateStr,
    todayDayOfWeek,
    yesterdayDayOfWeek,
    holidays,
  ]);

  // ── Check if we're still loading ──
  const isLoading = useScheduleStore((s) => s.loading);
  if (isLoading) {
    return (
      <div className="flex flex-col md:flex-row w-full gap-4">
        {[1, 2].map((i) => (
          <Card
            key={i}
            className="min-w-0 flex-1 w-full border border-border/60 bg-card/45 backdrop-blur-md"
          >
            <CardContent className="flex h-full flex-col justify-between space-y-5 p-5">
              <div className="space-y-2.5">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-7 w-32 rounded-xl" />
              </div>
              <div className="space-y-2.5">
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const count = sortedSchedulesWithWorkDates.length;
  if (count === 0) {
    return (
      <Card className="w-full border border-border/60 bg-card/45 backdrop-blur-md">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <UserCheck className="size-5 text-primary" />
            Presensi Mandiri
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Lakukan pencatatan presensi harian di sini.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/15 text-amber-600 dark:text-amber-400 p-4 rounded-2xl text-xs font-semibold">
            <AlertCircle className="size-5 shrink-0" />
            <span>
              Tidak ada jadwal kerja untuk Anda hari ini (Hari Libur / Off).
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3 w-full">
      {count <= 2 ? (
        <div className="flex flex-col md:flex-row w-full gap-4">
          {sortedSchedulesWithWorkDates.map(({ schedule, workDate }) => (
            <TakeAttendanceCard
              key={`${schedule.id}-${workDate}`}
              schedule={schedule}
              workDate={workDate}
              userId={userId}
              userName={userName}
              className="min-w-0 flex-1 w-full"
              agencyRule={agencyRule}
            />
          ))}
        </div>
      ) : (
        <div className="scrollbar-thin flex w-full snap-x snap-mandatory gap-4 overflow-x-auto p-1">
          {sortedSchedulesWithWorkDates.map(({ schedule, workDate }) => (
            <TakeAttendanceCard
              key={`${schedule.id}-${workDate}`}
              schedule={schedule}
              workDate={workDate}
              userId={userId}
              userName={userName}
              className="min-w-[320px] shrink-0 snap-start flex-1"
              agencyRule={agencyRule}
            />
          ))}
        </div>
      )}
    </div>
  );
}
