"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import UserAttendances from "@/components/custom/user-attendances";
import { type AttendanceHistoriesCardProps } from "@/interfaces/dashboard";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatWeekRange } from "@/lib/date-utils";
import type { Schedule, Attendance } from "@/interfaces/models";
import UserAttendanceDetailDialog from "./user-attendance-detail-dialog";

export default function AttendanceHistoriesCard({
  userId,
  refreshTrigger,
}: AttendanceHistoriesCardProps) {
  const isMobile = useIsMobile();
  // Calendar Month State
  const [currentMonth, setCurrentMonth] = useState<Date>(() => new Date());

  // Detail Dialog State
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [selectedAttendance, setSelectedAttendance] = useState<Attendance | null>(null);

  /**
   * Handles opening the attendance detail dialog when a calendar day/attendance is clicked.
   *
   * @param date - The selected date.
   * @param schedule - The schedule for that day.
   * @param attendance - The attendance record if it exists, otherwise null.
   */
  const handleDayClick = (
    date: Date,
    schedule: Schedule,
    attendance: Attendance | null
  ) => {
    setSelectedDate(date);
    setSelectedSchedule(schedule);
    setSelectedAttendance(attendance);
    setIsDetailDialogOpen(true);
  };

  const handleNextMonth = () => {
    setCurrentMonth((current) => {
      if (isMobile) {
        const next = new Date(current);
        next.setDate(current.getDate() + 7);
        return next;
      }
      return new Date(current.getFullYear(), current.getMonth() + 1, 1);
    });
  };

  const handlePrevMonth = () => {
    setCurrentMonth((current) => {
      if (isMobile) {
        const prev = new Date(current);
        prev.setDate(current.getDate() - 7);
        return prev;
      }
      return new Date(current.getFullYear(), current.getMonth() - 1, 1);
    });
  };

  const handleGoToToday = () => {
    setCurrentMonth(new Date());
  };

  return (
    <Card className="w-full transition-all duration-300 hover:shadow-md border border-border/60 bg-card/45 backdrop-blur-md">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6">
        <div className="space-y-1">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <CalendarDays className="size-5 text-primary" />
            {isMobile ? "Riwayat Presensi Mingguan" : "Riwayat Presensi Bulanan"}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {isMobile
              ? "Pantau ringkasan presensi dan jadwal harian Anda minggu ini."
              : "Pantau ringkasan presensi dan jadwal harian Anda sepanjang bulan."}
          </p>
        </div>

        {/* Month Selection Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGoToToday}
            className="rounded-xl font-semibold text-xs h-8.5 px-3"
            type="button"
          >
            {isMobile ? "Minggu Ini" : "Bulan Ini"}
          </Button>
          <div className="flex items-center gap-1 rounded-xl border border-border bg-card/60 p-0.5 shadow-sm">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevMonth}
              className="size-7.5 rounded-lg"
              type="button"
            >
              <ChevronLeft className="size-3.5" />
            </Button>
            <div className="w-36 text-center text-xs font-extrabold tracking-wide uppercase px-1">
              {isMobile ? formatWeekRange(currentMonth) : format(currentMonth, "MMMM yyyy", { locale: id })}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextMonth}
              className="size-7.5 rounded-lg"
              type="button"
            >
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Calendar Grid wrapper */}
        <UserAttendances
          userId={userId}
          currentMonth={currentMonth}
          onDayClick={handleDayClick}
          refreshTrigger={refreshTrigger}
        />

        {/* Calendar Legends */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-2 justify-center text-xs text-muted-foreground font-semibold">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-emerald-500" /> Hadir
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-amber-500" /> Terlambat
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-sky-500" /> Sakit
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-violet-500" /> Izin
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-destructive" /> Alpa
          </span>
        </div>
      </CardContent>

      <UserAttendanceDetailDialog
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
        date={selectedDate}
        schedule={selectedSchedule}
        attendance={selectedAttendance}
      />
    </Card>
  );
}
