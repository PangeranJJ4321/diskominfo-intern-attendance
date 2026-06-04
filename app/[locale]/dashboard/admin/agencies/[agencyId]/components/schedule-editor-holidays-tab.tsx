"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, isSameDay, isSameMonth, isToday } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";

import ScheduleEditorHolidayDialog from "./schedule-editor-holiday-dialog";

type DayLabel = {
  value: number;
  short: string;
  long: string;
  weekend: boolean;
};

type Holiday = {
  id: string;
  date: Date;
  description: string;
};

type ScheduleEditorHolidaysTabProps = {
  agencyId: string;
  dayLabels: DayLabel[];
};

const MOCK_HOLIDAYS: Holiday[] = [
  {
    id: "1",
    date: new Date(2026, 4, 1),
    description: "Hari Buruh Internasional",
  },
  {
    id: "2",
    date: new Date(2026, 4, 14),
    description: "Kenaikan Yesus Kristus",
  },
  { id: "3", date: new Date(2026, 4, 23), description: "Hari Raya Waisak" },
];

export default function ScheduleEditorHolidaysTab({
  agencyId,
  dayLabels,
}: ScheduleEditorHolidaysTabProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 4));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);

  useEffect(() => {
    if (!agencyId) {
      return;
    }

    const loadHolidays = async () => {
      setIsLoading(true);

      try {
        const response = await fetch(
          `/api/agency-holidays?agencyId=${agencyId}`,
        );

        if (!response.ok) {
          setHolidays(MOCK_HOLIDAYS);
          return;
        }

        const json = (await response.json()) as {
          data?: Array<{ id: string; date: string; description: string }>;
        };

        const parsedHolidays: Holiday[] = (json.data ?? []).map((holiday) => ({
          id: holiday.id,
          date: new Date(holiday.date),
          description: holiday.description,
        }));

        setHolidays(parsedHolidays);
      } catch {
        setHolidays(MOCK_HOLIDAYS);
      } finally {
        setIsLoading(false);
      }
    };

    void loadHolidays();
  }, [agencyId]);

  const visibleHolidays = agencyId ? holidays : [];
  const shouldShowLoading = Boolean(agencyId) && isLoading;

  const nextMonth = () =>
    setCurrentMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() + 1, 1),
    );
  const prevMonth = () =>
    setCurrentMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() - 1, 1),
    );
  const goToToday = () => setCurrentMonth(new Date());

  const openHolidayModal = (date: Date, existingHoliday?: Holiday) => {
    setSelectedDate(date);
    setEditingHoliday(existingHoliday || null);
    setIsModalOpen(true);
  };

  const handleSuccessAdd = (holiday: Holiday) => {
    setHolidays((current) => [...current, holiday]);
  };

  const handleSuccessUpdate = (updatedHoliday: Holiday) => {
    setHolidays((current) =>
      current.map((holiday) =>
        holiday.id === updatedHoliday.id ? updatedHoliday : holiday,
      ),
    );
  };

  const handleSuccessDelete = (id: string) => {
    setHolidays((current) => current.filter((holiday) => holiday.id !== id));
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

  const calendarDays: Date[] = [];
  let day = startDate;

  while (day <= endDate) {
    calendarDays.push(new Date(day));
    day = new Date(day);
    day.setDate(day.getDate() + 1);
  }

  if (shouldShowLoading) {
    return (
      <Card className="flex flex-col items-center justify-center gap-4 p-10 text-muted-foreground">
        <Spinner className="size-8" />
        <p className="text-sm">Memuat jadwal hari libur</p>
      </Card>
    );
  }

  return (
    <>
      <TabsContent value="holidays" className="space-y-4 outline-none">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <h3 className="text-base font-semibold">
              Kalender Libur Nasional & Pengecualian
            </h3>
            <p className="text-sm text-muted-foreground">
              Klik hari apa saja pada kalender untuk menambah atau mengubah hari
              libur.
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
              Hari Ini
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
              <div className="w-32 text-center text-sm font-semibold">
                {format(currentMonth, "MMMM yyyy")}
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
        </div>

        <div className="overflow-hidden rounded-xl border">
          <div className="grid grid-cols-7 border-b bg-muted/30 text-center text-sm font-medium text-muted-foreground">
            {dayLabels.map((dayLabel) => (
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
              const dayHolidays = visibleHolidays.filter((holiday) =>
                isSameDay(holiday.date, calendarDay),
              );
              const isCurrentMonth = isSameMonth(calendarDay, currentMonth);
              const isTodayDate = isToday(calendarDay);

              return (
                <div
                  key={`${calendarDay.toISOString()}-${index}`}
                  onClick={() => openHolidayModal(calendarDay)}
                  className={`relative flex min-h-30 cursor-pointer flex-col gap-1 bg-background p-2 transition-colors hover:bg-muted/30 ${
                    !isCurrentMonth ? "bg-muted/10 text-muted-foreground" : ""
                  }`}
                >
                  <div className="flex justify-end">
                    <span
                      className={`flex size-7 items-center justify-center rounded-full text-sm font-medium ${
                        isTodayDate ? "bg-primary text-primary-foreground" : ""
                      }`}
                    >
                      {format(calendarDay, "d")}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1 overflow-hidden">
                    {dayHolidays.map((holiday) => (
                      <div
                        key={holiday.id}
                        onClick={(event) => {
                          event.stopPropagation();
                          openHolidayModal(calendarDay, holiday);
                        }}
                        className="truncate rounded-md bg-destructive/10 px-2 py-1 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/20"
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
      </TabsContent>

      <ScheduleEditorHolidayDialog
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        agencyId={agencyId}
        selectedDate={selectedDate}
        editingHoliday={editingHoliday}
        onSuccessAdd={handleSuccessAdd}
        onSuccessUpdate={handleSuccessUpdate}
        onSuccessDelete={handleSuccessDelete}
      />
    </>
  );
}
