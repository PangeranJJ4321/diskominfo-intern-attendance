"use client";

import { useEffect, useState, useMemo } from "react";
import { format, subDays } from "date-fns";
import { AlertCircle, UserCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getSchedules } from "@/lib/services/schedules";
import { getShiftAssignments } from "@/lib/services/shift-assignments";
import { getHolidays } from "@/lib/services/holidays";
import { getAttendancesForUser } from "@/lib/services/attendances";
import { getUserFaceDescriptors } from "@/lib/services/users";
import type {
  Schedule,
  Attendance,
  ShiftAssignment,
  Holiday,
} from "@/interfaces/models";
import type { TakeAttendanceListProps } from "@/interfaces/dashboard";
import TakeAttendanceCard from "./take-attendance-card";

/**
 * Renders the list of attendance cards for the user's scheduled shifts of the day.
 *
 * @param {TakeAttendanceListProps} props - The component props.
 * @param {string} props.userId - The user ID.
 * @param {string} props.userName - The name of the user.
 * @param {{ latitude: number; longitude: number; accuracy: number } | null} props.currentLocation - Current GPS location of the user.
 * @param {boolean | null} props.isWithinGeofence - Whether the user is within the geofence area.
 * @param {function} props.onAttendanceSuccess - Callback when attendance is successfully updated.
 * @param {number} props.refreshTrigger - Trigger to reload attendance data.
 * @returns {React.JSX.Element} The rendered list of cards.
 */
export default function TakeAttendanceList({
  userId,
  userName,
  currentLocation,
  isWithinGeofence,
  onAttendanceSuccess,
  refreshTrigger,
  agencyRule,
}: TakeAttendanceListProps) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [userHasFaceRegistered, setUserHasFaceRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const todayDateStr = format(new Date(), "yyyy-MM-dd");
    const yesterdayDateStr = format(subDays(new Date(), 1), "yyyy-MM-dd");
    const todayDay = new Date().getDay();
    const yesterdayDay = subDays(new Date(), 1).getDay();
    const relevantDays = [...new Set([todayDay, yesterdayDay])];
    async function loadData() {
      setIsLoading(true);
      try {
        const [scheds, atts, assigns, hols] = await Promise.all([
          getSchedules(1000, relevantDays),
          getAttendancesForUser(userId, 1000, yesterdayDateStr, todayDateStr),
          getShiftAssignments(1000, yesterdayDateStr, todayDateStr),
          getHolidays(1000, yesterdayDateStr, todayDateStr),
        ]);
        setSchedules(scheds);
        setAttendances(atts);
        setAssignments(assigns);
        setHolidays(hols);
      } catch (err) {
        console.error("Gagal memuat data presensi", err);
      } finally {
        setIsLoading(false);
      }
    }
    void loadData();
  }, [userId, refreshTrigger]);

  const todayDateStr = useMemo(() => {
    return format(new Date(), "yyyy-MM-dd");
  }, []);

  const yesterdayDateStr = useMemo(() => {
    return format(subDays(new Date(), 1), "yyyy-MM-dd");
  }, []);

  const todayDayOfWeek = useMemo(() => {
    return new Date().getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  }, []);

  const yesterdayDayOfWeek = useMemo(() => {
    return subDays(new Date(), 1).getDay();
  }, []);

  // Fetch face descriptors from the API
  useEffect(() => {
    if (!userId) return;

    async function checkFaceRegistration() {
      try {
        const data = await getUserFaceDescriptors(userId);
        setUserHasFaceRegistered(data.data && data.data.length > 0);
      } catch (error) {
        console.error("Failed to fetch user face descriptors:", error);
      }
    }

    void checkFaceRegistration();
  }, [userId, refreshTrigger]);

  // Filter active schedules for today (including active yesterday overnight shifts)
  const sortedSchedulesWithWorkDates = useMemo(() => {
    const now = new Date();
    const currentLocalTimeStr = format(now, "HH:mm:ss");

    // 1. Get assignments active for yesterday and today
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
        // If yesterday was a holiday, only allow if configured to work on holidays
        const allowedYesterday = !yesterdayHols || s.shift?.workOnHolidays;
        if (allowedYesterday) {
          // If current local time is before the overnight schedule's end time, it is still active!
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
        // Must check if today is a holiday
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
    userId,
    todayDateStr,
    yesterdayDateStr,
    todayDayOfWeek,
    yesterdayDayOfWeek,
    holidays,
  ]);

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
              attendances={attendances}
              workDate={workDate}
              userId={userId}
              userName={userName}
              userHasFaceRegistered={userHasFaceRegistered}
              currentLocation={currentLocation}
              isWithinGeofence={isWithinGeofence}
              onAttendanceSuccess={onAttendanceSuccess}
              refreshTrigger={refreshTrigger}
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
              attendances={attendances}
              workDate={workDate}
              userId={userId}
              userName={userName}
              userHasFaceRegistered={userHasFaceRegistered}
              currentLocation={currentLocation}
              isWithinGeofence={isWithinGeofence}
              onAttendanceSuccess={onAttendanceSuccess}
              refreshTrigger={refreshTrigger}
              className="min-w-[320px] shrink-0 snap-start flex-1"
              agencyRule={agencyRule}
            />
          ))}
        </div>
      )}
    </div>
  );
}
