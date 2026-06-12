"use client";

import { useEffect, useState, useMemo } from "react";
import { format, subDays } from "date-fns";
import { AlertCircle, UserCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useScheduleStore } from "@/stores/useScheduleStore";
import { useShiftAssignmentStore } from "@/stores/useShiftAssignmentStore";
import { useAttendanceStore } from "@/stores/useAttendanceStore";
import { useAgencyHolidayStore } from "@/stores/useAgencyHolidayStore";
import type { Schedule } from "@/interfaces/models";
import type { TakeAttendanceListProps } from "@/interfaces/dashboard";
import TakeAttendanceCard from "./take-attendance-card";

/**
 * Renders the list of attendance cards for the user's scheduled shifts of the day.
 * Uses Zustand stores for all data (schedules, assignments, attendances, holidays,
 * location, geofence) — no prop drilling required. Attendances and face registration
 * are read directly from stores by child cards.
 *
 * @param {TakeAttendanceListProps} props - The component props.
 * @param {string} props.internId - The intern ID.
 * @returns {React.JSX.Element} The rendered list of cards.
 */
export default function TakeAttendanceList({
  internId,
}: TakeAttendanceListProps) {
  // Zustand stores - each selector subscribes to just the slice it needs
  const schedules = useScheduleStore((s) => s.schedules);
  const fetchSchedules = useScheduleStore((s) => s.fetchSchedules);
  const assignments = useShiftAssignmentStore((s) => s.assignments);
  const fetchAssignments = useShiftAssignmentStore((s) => s.fetchAssignments);
  const fetchAttendancesForIntern = useAttendanceStore(
    (s) => s.fetchAttendancesForIntern,
  );
  const holidays = useAgencyHolidayStore((s) => s.holidays);
  const fetchHolidays = useAgencyHolidayStore((s) => s.fetchHolidays);
  const loading = useAttendanceStore((s) => s.loading);

  const [isLoading, setIsLoading] = useState(true);

  const todayDateStr = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);
  const yesterdayDateStr = useMemo(
    () => format(subDays(new Date(), 1), "yyyy-MM-dd"),
    [],
  );
  const todayDayOfWeek = useMemo(() => new Date().getDay(), []);
  const yesterdayDayOfWeek = useMemo(() => subDays(new Date(), 1).getDay(), []);

  const relevantDays = useMemo(
    () => [...new Set([todayDayOfWeek, yesterdayDayOfWeek])],
    [todayDayOfWeek, yesterdayDayOfWeek],
  );

  // Fetch schedules, assignments, attendances, and holidays via Zustand stores
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        await Promise.all([
          fetchSchedules(1000, relevantDays),
          fetchAttendancesForIntern(
            internId,
            1000,
            yesterdayDateStr,
            todayDateStr,
          ),
          fetchAssignments(1000, yesterdayDateStr, todayDateStr),
          fetchHolidays(1000, yesterdayDateStr, todayDateStr),
        ]);
      } catch (err) {
        console.error("Gagal memuat data presensi", err);
      } finally {
        setIsLoading(false);
      }
    }

    void loadData();
  }, [
    internId,
    fetchSchedules,
    fetchAttendancesForIntern,
    fetchAssignments,
    fetchHolidays,
    relevantDays,
    todayDateStr,
    yesterdayDateStr,
  ]);

  // Filter active schedules for today (including active yesterday overnight shifts)
  const sortedSchedulesWithWorkDates = useMemo(() => {
    const now = new Date();
    const currentLocalTimeStr = format(now, "HH:mm:ss");

    // 1. Get assignments active for yesterday and today
    const assignmentsYesterday = assignments.filter((a) => {
      if (a.internId !== internId) return false;
      return (
        a.startDate <= yesterdayDateStr &&
        (!a.endDate || a.endDate >= yesterdayDateStr)
      );
    });

    const assignmentsToday = assignments.filter((a) => {
      if (a.internId !== internId) return false;
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

    // Sort by scheduleStart
    return activeList.sort((a, b) =>
      a.schedule.scheduleStart.localeCompare(b.schedule.scheduleStart),
    );
  }, [
    schedules,
    assignments,
    internId,
    todayDateStr,
    yesterdayDateStr,
    todayDayOfWeek,
    yesterdayDayOfWeek,
    holidays,
  ]);

  if (isLoading || loading) {
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
              internId={internId}
              className="min-w-0 flex-1 w-full"
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
              internId={internId}
              className="min-w-[320px] shrink-0 snap-start flex-1"
            />
          ))}
        </div>
      )}
    </div>
  );
}
