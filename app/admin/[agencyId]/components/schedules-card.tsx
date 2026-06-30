"use client";

import { useEffect, useState } from "react";
import { Clock, Plus, CalendarDays } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import HolidaysTab from "./holidays-tab";
import ShiftsControl from "./shifts-control";
import ShiftCreateDialog from "./shift-create-dialog";
import ShiftEditDialog from "./shift-edit-dialog";
import ScheduleCreateDialog from "./schedule-create-dialog";
import ScheduleEditDialog from "./schedule-edit-dialog";

import { getShifts, deleteShift } from "@/lib/services/shifts";
import { getSchedules } from "@/lib/services/schedules";
import { getAgencies } from "@/lib/services/agencies";
import type { Shift, Schedule } from "@/interfaces/models";

type DayLabel = {
  value: number;
  short: string;
  long: string;
  weekend: boolean;
};

const DAY_LABELS: DayLabel[] = [
  { value: 0, short: "Min", long: "Minggu", weekend: true },
  { value: 1, short: "Sen", long: "Senin", weekend: false },
  { value: 2, short: "Sel", long: "Selasa", weekend: false },
  { value: 3, short: "Rab", long: "Rabu", weekend: false },
  { value: 4, short: "Kam", long: "Kamis", weekend: false },
  { value: 5, short: "Jum", long: "Jumat", weekend: false },
  { value: 6, short: "Sab", long: "Sabtu", weekend: true },
];

/**
 * Component representing the weekly schedules and shifts management.
 */
/**
 * Props for the SchedulesCard component.
 */
interface SchedulesCardProps {
  agencyId: string;
}

/**
 * Component representing the weekly schedules and shifts management.
 *
 * @param props - The component props.
 * @param props.agencyId - The current agency ID.
 */
export default function SchedulesCard({ agencyId }: SchedulesCardProps) {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedShiftId, setSelectedShiftId] = useState<string>("");
  const [defaultShiftId, setDefaultShiftId] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Weekly Create Dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(1);

  // Weekly Edit Dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

  // Shift Dialogs state
  const [isShiftCreateOpen, setIsShiftCreateOpen] = useState(false);
  const [isShiftEditOpen, setIsShiftEditOpen] = useState(false);

  // Confirm Delete Shift state
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsClient(true);
      void loadData();
    }, 0);

    async function loadData() {
      setIsLoading(true);
      try {
        const [loadedShifts, loadedSchedules, loadedAgencies] =
          await Promise.all([getShifts(), getSchedules(), getAgencies()]);
        setShifts(loadedShifts);
        setSchedules(loadedSchedules);

        const currentAgency = loadedAgencies.find((a) => a.id === agencyId);
        setDefaultShiftId(currentAgency?.defaultShiftId ?? null);

        if (loadedShifts.length > 0) {
          setSelectedShiftId(loadedShifts[0].id);
        }
      } catch (err) {
        console.error("Gagal memuat data shift dan jadwal", err);
        toast.error("Gagal memuat data shift dan jadwal");
      } finally {
        setIsLoading(false);
      }
    }

    return () => clearTimeout(timer);
  }, [agencyId]);

  /**
   * Callback when a shift is successfully created.
   *
   * @param newShift - The newly created shift.
   */
  const handleCreateShiftSuccess = (newShift: Shift, setAsDefault: boolean) => {
    setShifts((prev) => [...prev, newShift]);
    setSelectedShiftId(newShift.id);
    if (setAsDefault) {
      setDefaultShiftId(newShift.id);
    }
  };

  /**
   * Callback when a shift is successfully edited.
   *
   * @param updatedShift - The updated shift details.
   */
  const handleEditShiftSuccess = (
    updatedShift: Shift,
    setAsDefault: boolean,
  ) => {
    setShifts((prev) =>
      prev.map((s) => (s.id === updatedShift.id ? updatedShift : s)),
    );
    if (setAsDefault) {
      setDefaultShiftId(updatedShift.id);
    }
  };

  /**
   * Initiates the shift deletion process.
   */
  const handleDeleteShift = () => {
    if (!selectedShiftId) return;

    const shiftToDelete = shifts.find((s) => s.id === selectedShiftId);
    if (!shiftToDelete) return;

    setIsConfirmDeleteOpen(true);
  };

  /**
   * Deletes the selected shift from the database.
   */
  const executeDeleteShift = async () => {
    try {
      await deleteShift(selectedShiftId);
      const updatedShifts = shifts.filter((s) => s.id !== selectedShiftId);
      setShifts(updatedShifts);

      // Cascade delete schedules locally
      const updatedSchedules = schedules.filter(
        (s) => s.shiftId !== selectedShiftId,
      );
      setSchedules(updatedSchedules);

      // Select another shift if available
      if (updatedShifts.length > 0) {
        setSelectedShiftId(updatedShifts[0].id);
      } else {
        setSelectedShiftId("");
      }

      toast.success("Shift dan jadwal terkait berhasil dihapus");
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Gagal menghapus shift";
      toast.error(errorMsg);
    }
  };
  const openScheduleModal = (dayValue: number, schedule?: Schedule) => {
    if (!selectedShiftId) {
      toast.error("Silakan pilih atau buat shift terlebih dahulu.");
      return;
    }
    setSelectedDay(dayValue);
    if (schedule) {
      setEditingSchedule(schedule);
      setIsEditDialogOpen(true);
    } else {
      setEditingSchedule(null);
      setIsCreateDialogOpen(true);
    }
  };

  const handleAddSchedule = (newSchedule: Schedule) => {
    setSchedules((prev) => [...prev, newSchedule]);
  };

  const handleUpdateSchedule = (updatedSchedule: Schedule) => {
    setSchedules((prev) =>
      prev.map((s) => (s.id === updatedSchedule.id ? updatedSchedule : s)),
    );
  };

  const handleDeleteSchedule = (idToDelete: string) => {
    setSchedules((prev) => prev.filter((s) => s.id !== idToDelete));
  };

  if (!isClient || isLoading) {
    return (
      <Card className="overflow-hidden p-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <div className="space-y-4">
              <Skeleton className="h-14 w-full" />
              <div className="grid grid-cols-7 gap-4">
                {Array.from({ length: 7 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  const selectedShift = shifts.find((s) => s.id === selectedShiftId);
  const selectedDayName =
    DAY_LABELS.find((d) => d.value === selectedDay)?.long || "";

  return (
    <Card className="overflow-hidden p-6">
      <div className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight">
            Jadwal & Shift Kerja
          </h2>
          <p className="text-sm text-muted-foreground">
            Kelola shift kerja, jadwal masuk mingguan, dan konfigurasi hari
            libur
          </p>
        </div>

        <Tabs defaultValue="holidays" className="w-full space-y-6">
          <TabsList className="justify-start w-fit">
            <TabsTrigger value="holidays">Hari Libur & Cuti</TabsTrigger>
            <TabsTrigger value="weekly">Jadwal Shift Mingguan</TabsTrigger>
          </TabsList>

          {/* Weekly Schedule Content */}
          <TabsContent value="weekly" className="space-y-6 outline-hidden">
            {/* Shifts Controls component */}
            <ShiftsControl
              shifts={shifts}
              selectedShiftId={selectedShiftId}
              defaultShiftId={defaultShiftId}
              onSelectShiftId={setSelectedShiftId}
              onAddShiftClick={() => setIsShiftCreateOpen(true)}
              onEditShiftClick={() => setIsShiftEditOpen(true)}
              onDeleteShiftClick={handleDeleteShift}
            />

            {selectedShiftId ? (
              <div className="overflow-hidden rounded-lg border border-border">
                {/* Desktop Header */}
                <div className="hidden grid-cols-7 border-b bg-muted/30 text-center text-xs font-bold text-muted-foreground uppercase md:grid">
                  {DAY_LABELS.map((dayLabel) => (
                    <div
                      key={dayLabel.value}
                      className={`py-3 ${dayLabel.weekend ? "text-destructive/80" : ""}`}
                    >
                      {dayLabel.long}
                    </div>
                  ))}
                </div>

                {/* Grid Cells */}
                <div className="grid grid-cols-1 gap-px bg-border dark:bg-border/40 md:grid-cols-7">
                  {DAY_LABELS.map((dayLabel) => {
                    const daySchedules = schedules
                      .filter(
                        (s) =>
                          s.shiftId === selectedShiftId &&
                          s.dayOfWeek === dayLabel.value,
                      )
                      .sort((a, b) =>
                        a.scheduleStart.localeCompare(b.scheduleStart),
                      );

                    return (
                      <div
                        key={dayLabel.value}
                        className={`flex min-h-40 md:min-h-56 flex-col bg-background ${
                          dayLabel.weekend ? "bg-muted/10" : ""
                        }`}
                      >
                        <div className="flex flex-1 flex-col gap-2.5 p-3">
                          {/* Mobile Day Name Header */}
                          <div
                            className={`text-xs font-bold uppercase tracking-wider md:hidden pb-1 border-b border-border/40 mb-1 ${
                              dayLabel.weekend
                                ? "text-destructive/80"
                                : "text-muted-foreground"
                            }`}
                          >
                            {dayLabel.long}
                          </div>

                          {daySchedules.length === 0 ? (
                            <button
                              type="button"
                              onClick={() => openScheduleModal(dayLabel.value)}
                              className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-muted-foreground/35 bg-muted/5 px-3 py-6 text-center text-xs text-muted-foreground transition-all hover:border-primary/50 hover:bg-muted/15 cursor-pointer"
                            >
                              <Plus className="size-4 text-muted-foreground/60" />
                              <span>Tambah jadwal</span>
                            </button>
                          ) : (
                            <div className="flex flex-1 flex-col gap-2">
                              {daySchedules.map((schedule) => (
                                <button
                                  key={schedule.id}
                                  type="button"
                                  onClick={() =>
                                    openScheduleModal(dayLabel.value, schedule)
                                  }
                                  className="w-full group rounded-lg border border-border bg-card px-3 py-2.5 text-left shadow-sm transition-all hover:border-primary/40 hover:shadow-xs cursor-pointer animate-in fade-in zoom-in-95 duration-155"
                                >
                                  <div className="space-y-1">
                                    <p className="truncate text-xs font-bold text-foreground/80 group-hover:text-primary transition-colors">
                                      {schedule.name}
                                    </p>
                                    <div className="flex flex-col gap-0.5 text-xs text-muted-foreground font-semibold">
                                      <div className="flex items-center gap-1">
                                        <Clock className="size-3 text-primary/70" />
                                        <span>
                                          {schedule.scheduleStart} -{" "}
                                          {schedule.scheduleEnd}
                                        </span>
                                      </div>
                                      <div className="text-xs text-muted-foreground/85 font-normal">
                                        Mulai: {schedule.windowStart} |
                                        Toleransi: {schedule.lateCutoff}
                                      </div>
                                    </div>
                                  </div>
                                </button>
                              ))}

                              <button
                                type="button"
                                onClick={() =>
                                  openScheduleModal(dayLabel.value)
                                }
                                className="w-full flex-1 flex items-center justify-center gap-1 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/5 py-2 text-center text-xs text-muted-foreground transition-all hover:border-primary/40 hover:bg-muted/15 cursor-pointer"
                              >
                                <Plus className="size-3.5" />
                                <span className="text-xs font-semibold">
                                  Tambah
                                </span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border p-12 text-center text-sm text-muted-foreground flex flex-col items-center justify-center gap-3">
                <CalendarDays className="size-10 text-muted-foreground/50" />
                <div>
                  <p className="font-semibold text-foreground">
                    Tidak Ada Shift Terpilih
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Silakan pilih shift atau tambah shift baru untuk mulai
                    menjadwalkan.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => setIsShiftCreateOpen(true)}
                  className="rounded-lg mt-2 bg-primary text-primary-foreground text-xs font-semibold"
                >
                  <Plus className="size-3.5 mr-1" /> Buat Shift Pertama
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Holidays Content */}
          <HolidaysTab dayLabels={DAY_LABELS} />
        </Tabs>
      </div>

      {/* Weekly Schedule Create Dialog */}
      <ScheduleCreateDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        selectedDay={selectedDay}
        selectedShiftId={selectedShiftId}
        onSuccess={handleAddSchedule}
        dayName={selectedDayName}
      />

      {/* Weekly Schedule Edit Dialog */}
      <ScheduleEditDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        editingSchedule={editingSchedule}
        onSuccessUpdate={handleUpdateSchedule}
        onSuccessDelete={handleDeleteSchedule}
        dayName={
          editingSchedule
            ? DAY_LABELS.find((d) => d.value === editingSchedule.dayOfWeek)
                ?.long || ""
            : ""
        }
      />

      {/* Shift Create Dialog */}
      <ShiftCreateDialog
        open={isShiftCreateOpen}
        onOpenChange={setIsShiftCreateOpen}
        agencyId={agencyId}
        onSuccess={handleCreateShiftSuccess}
      />

      {/* Shift Edit Dialog */}
      <ShiftEditDialog
        open={isShiftEditOpen}
        onOpenChange={setIsShiftEditOpen}
        shift={selectedShift || null}
        isDefaultShift={(selectedShift?.id ?? "") === (defaultShiftId ?? "")}
        agencyId={agencyId}
        onSuccess={handleEditShiftSuccess}
      />

      {/* Confirm Delete Shift Alert Dialog */}
      <AlertDialog
        open={isConfirmDeleteOpen}
        onOpenChange={setIsConfirmDeleteOpen}
      >
        <AlertDialogContent className="border border-border bg-card/90 backdrop-blur-md shadow-lg rounded-lg p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold">
              Apakah Anda yakin?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              Apakah Anda yakin ingin menghapus shift
              <strong> {selectedShift?.name}</strong> beserta semua jadwalnya?
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex sm:justify-end gap-2 pt-2">
            <AlertDialogCancel className="rounded-lg text-xs h-9">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={executeDeleteShift}
              className="rounded-lg text-xs h-9 font-semibold"
            >
              Hapus Shift
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
