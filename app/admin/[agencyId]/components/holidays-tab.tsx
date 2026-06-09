"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { format, isSameMonth, isToday } from "date-fns";
import { id } from "date-fns/locale";
import { getCalendarDays, formatWeekRange } from "@/lib/date-utils";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

import { Button } from "@/components/ui/button";
import { TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

import HolidayCreateDialog from "./holiday-create-dialog";
import HolidayEditDialog from "./holiday-edit-dialog";
import { getHolidays } from "@/lib/services/holidays";
import type { Holiday } from "@/interfaces/models";
import type { HolidaysTabProps } from "@/interfaces/admin";

export default function HolidaysTab({ dayLabels }: HolidaysTabProps) {
  const isMobile = useIsMobile();
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(() => new Date());

  // Dialog States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null);

  useEffect(() => {
    async function loadHolidays() {
      setIsLoading(true);
      try {
        const data = await getHolidays();
        setHolidays(data);
      } catch (err) {
        console.error("Gagal memuat data hari libur", err);
        toast.error("Gagal memuat data hari libur");
      } finally {
        setIsLoading(false);
      }
    }
    loadHolidays();
  }, []);

  // Month navigation helpers
  const handleNextMonth = () => {
    if (isMobile) {
      const next = new Date(currentMonth);
      next.setDate(currentMonth.getDate() + 7);
      setCurrentMonth(next);
    } else {
      setCurrentMonth(
        new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
      );
    }
  };

  const handlePrevMonth = () => {
    if (isMobile) {
      const prev = new Date(currentMonth);
      prev.setDate(currentMonth.getDate() - 7);
      setCurrentMonth(prev);
    } else {
      setCurrentMonth(
        new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
      );
    }
  };

  const handleGoToToday = () => {
    setCurrentMonth(new Date());
  };

  // Calendar logic
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

  // Event handlers for CRUD
  const handleCellClick = (calendarDay: Date) => {
    setSelectedDate(calendarDay);
    setIsCreateOpen(true);
  };

  const handleAddHoliday = (newHoliday: Holiday) => {
    setHolidays((prev) => [...prev, newHoliday]);
  };

  const handleUpdateHoliday = (updatedHoliday: Holiday) => {
    setHolidays((prev) =>
      prev.map((h) => (h.id === updatedHoliday.id ? updatedHoliday : h)),
    );
  };

  const handleDeleteHoliday = (idToDelete: string) => {
    setHolidays((prev) => prev.filter((h) => h.id !== idToDelete));
  };

  if (isLoading) {
    return (
      <TabsContent value="holidays" className="space-y-6 outline-hidden">
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-6 w-1/4 animate-pulse" />
            <Skeleton className="h-4 w-1/2 animate-pulse" />
          </div>
          <Skeleton className="h-96 w-full rounded-lg animate-pulse" />
        </div>
      </TabsContent>
    );
  }

  if (isMobile) {
    return (
      <TabsContent value="holidays" className="space-y-6 outline-hidden">
        {/* Top Header Section */}
        <div className="flex flex-col gap-4">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold tracking-tight text-foreground/90 flex items-center gap-2">
              <Calendar className="size-5 text-primary/80" />
              Kalender Libur & Cuti Bersama
            </h3>
            <p className="text-xs text-muted-foreground">
              Klik pada tanggal untuk menambah atau mengedit hari libur
              operasional.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGoToToday}
              className="rounded-lg font-medium transition-all hover:bg-muted text-xs h-8 px-2.5 shrink-0"
              type="button"
            >
              Minggu Ini
            </Button>
            <div className="flex items-center gap-1.5 rounded-lg border border-border bg-card/60 p-1 shadow-sm backdrop-blur-xs flex-1 justify-between">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrevMonth}
                className="size-8 rounded-lg"
                type="button"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <div className="text-center text-xs font-semibold tracking-wide px-2">
                {formatWeekRange(currentMonth)}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNextMonth}
                className="size-8 rounded-lg"
                type="button"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Calendar Cells List for Mobile */}
        <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden divide-y divide-border">
          {calendarDays.map((calendarDay, index) => {
            const formattedDate = format(calendarDay, "yyyy-MM-dd");
            const dayHolidays = holidays.filter(
              (h) => h.date === formattedDate,
            );
            const isTodayDate = isToday(calendarDay);
            const isWeekend =
              calendarDay.getDay() === 0 || calendarDay.getDay() === 6;

            return (
              <div
                key={`${formattedDate}-${index}`}
                onClick={() => handleCellClick(calendarDay)}
                className={`flex items-center justify-between p-3.5 transition-all bg-card cursor-pointer hover:bg-muted/30 select-none ${
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
                    {isWeekend && (
                      <span className="text-[10px] text-destructive/80 font-bold mt-0.5">
                        Akhir Pekan
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Side: Holidays */}
                <div className="flex flex-col items-end gap-1.5 max-w-[50%]">
                  {dayHolidays.length > 0 ? (
                    dayHolidays.map((holiday) => (
                      <div
                        key={holiday.id}
                        onClick={(e) => {
                          e.stopPropagation(); // Avoid double click triggers
                          setSelectedHoliday(holiday);
                          setIsEditOpen(true);
                        }}
                        className="truncate rounded-lg bg-destructive/10 px-2.5 py-1.5 text-xs font-bold text-destructive hover:bg-destructive/15 transition-all border border-destructive/10"
                        title={holiday.description}
                      >
                        {holiday.description}
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground/60 italic py-1.5">
                      Tidak ada libur
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Dialog Components */}
        <HolidayCreateDialog
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          selectedDate={selectedDate}
          onSuccessAdd={handleAddHoliday}
        />

        <HolidayEditDialog
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          holiday={selectedHoliday}
          onSuccessUpdate={handleUpdateHoliday}
          onSuccessDelete={handleDeleteHoliday}
        />
      </TabsContent>
    );
  }

  return (
    <TabsContent value="holidays" className="space-y-6 outline-hidden">
      {/* Top Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold tracking-tight text-foreground/90 flex items-center gap-2">
            <Calendar className="size-5 text-primary/80" />
            Kalender Libur & Cuti Bersama
          </h3>
          <p className="text-sm text-muted-foreground">
            Klik pada tanggal kalender untuk menambah atau mengedit hari libur
            operasional.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGoToToday}
            className="hidden sm:inline-flex rounded-lg font-medium transition-all hover:bg-muted"
          >
            Hari Ini
          </Button>
          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-card/60 p-1 shadow-sm backdrop-blur-xs">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevMonth}
              className="size-8 rounded-lg"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <div className="w-32 text-center text-sm font-semibold tracking-wide">
              {format(currentMonth, "MMMM yyyy", { locale: id })}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextMonth}
              className="size-8 rounded-lg"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
        {/* Day Names Header */}
        <div className="grid grid-cols-7 border-b border-border bg-muted/30 text-center text-xs font-semibold tracking-wider text-muted-foreground uppercase py-3.5">
          {dayLabels.map((dayLabel) => (
            <div
              key={dayLabel.short}
              className={dayLabel.weekend ? "text-destructive/80" : ""}
            >
              <span className="hidden sm:inline">{dayLabel.long}</span>
              <span className="sm:hidden">{dayLabel.short}</span>
            </div>
          ))}
        </div>

        {/* Calendar Cells */}
        <div className="grid grid-cols-7 gap-px bg-border/40">
          {calendarDays.map((calendarDay, index) => {
            const formattedDate = format(calendarDay, "yyyy-MM-dd");
            const dayHolidays = holidays.filter(
              (h) => h.date === formattedDate,
            );
            const isCurrentMonth = isSameMonth(calendarDay, currentMonth);
            const isTodayDate = isToday(calendarDay);
            const isWeekend =
              calendarDay.getDay() === 0 || calendarDay.getDay() === 6;

            return (
              <div
                key={`${formattedDate}-${index}`}
                onClick={() => handleCellClick(calendarDay)}
                className={`group relative flex min-h-24 sm:min-h-28 cursor-pointer flex-col justify-between bg-card p-2.5 transition-all hover:bg-muted/30 select-none ${
                  !isCurrentMonth ? "bg-muted/10 text-muted-foreground/50" : ""
                } ${isWeekend && isCurrentMonth ? "bg-muted/5" : ""}`}
              >
                {/* Date Number Indicator */}
                <div className="flex justify-end items-center">
                  <span
                    className={`flex size-7 items-center justify-center rounded-full text-xs sm:text-sm font-semibold transition-all ${
                      isTodayDate
                        ? "bg-primary text-primary-foreground font-bold scale-110 shadow-sm"
                        : isWeekend
                          ? "text-destructive"
                          : "text-foreground/80"
                    }`}
                  >
                    {format(calendarDay, "d")}
                  </span>
                </div>

                {/* Cell Holiday Display */}
                <div className="flex flex-col gap-1 overflow-hidden mt-1.5">
                  {dayHolidays.map((holiday) => (
                    <div
                      key={holiday.id}
                      onClick={(e) => {
                        e.stopPropagation(); // Avoid double click triggers
                        setSelectedHoliday(holiday);
                        setIsEditOpen(true);
                      }}
                      className="truncate rounded-lg bg-destructive/10 px-2 py-1 text-xs sm:text-xs font-bold text-destructive hover:bg-destructive/15 transition-all border border-destructive/10"
                      title={holiday.description}
                    >
                      {holiday.description}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dialog Components */}
      <HolidayCreateDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        selectedDate={selectedDate}
        onSuccessAdd={handleAddHoliday}
      />

      <HolidayEditDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        holiday={selectedHoliday}
        onSuccessUpdate={handleUpdateHoliday}
        onSuccessDelete={handleDeleteHoliday}
      />
    </TabsContent>
  );
}
