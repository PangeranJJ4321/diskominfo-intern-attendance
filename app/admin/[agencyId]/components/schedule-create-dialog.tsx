"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSchedule } from "@/lib/services/schedules";
import { useScheduleStore } from "@/stores/schedule-store";
import type { ScheduleCreateDialogProps } from "@/interfaces/admin";
import { TimePicker } from "@/components/custom/time-picker";

/**
 * Component for creating a new schedule.
 *
 * @param props - Component properties.
 */
export default function ScheduleCreateDialog({
  open,
  onOpenChange,
  selectedDay,
  selectedShiftId,
  onSuccess,
  dayName,
}: ScheduleCreateDialogProps) {
  const [name, setName] = useState("Absen Masuk");
  const [windowStart, setWindowStart] = useState("07:00");
  const [scheduleStart, setScheduleStart] = useState("08:00");
  const [lateCutoff, setLateCutoff] = useState("08:15");
  const [scheduleEnd, setScheduleEnd] = useState("17:00");
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Handles opening and closing change of the dialog, resetting input fields on open.
   *
   * @param val - The new open state.
   */
  const handleOpenChange = (val: boolean) => {
    if (val) {
      setName("Absen Masuk");
      setWindowStart("07:00");
      setScheduleStart("08:00");
      setLateCutoff("08:15");
      setScheduleEnd("17:00");
    }
    onOpenChange(val);
  };

  /**
   * Handles saving the schedule to the database.
   *
   * @param e - Form event.
   */
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Nama jadwal tidak boleh kosong");
      return;
    }

    setIsSubmitting(true);
    try {
      const scheduleData = await createSchedule({
        shiftId: selectedShiftId,
        name: name.trim(),
        dayOfWeek: selectedDay,
        windowStart,
        scheduleStart,
        lateCutoff,
        scheduleEnd,
      });

      onSuccess(scheduleData);
      useScheduleStore.getState().addSchedule(scheduleData);
      toast.success("Jadwal mingguan berhasil ditambahkan");
      onOpenChange(false);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Gagal menyimpan jadwal";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90dvh] overflow-y-auto scrollbar-none p-4 sm:p-6">
        <DialogHeader className="space-y-1.5">
          <DialogTitle className="text-xl font-bold tracking-tight bg-linear-to-r from-foreground to-foreground/80 bg-clip-text">
            Tambah Jadwal Mingguan
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground font-medium">
            Hari: {dayName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-5 pt-2">
          <div className="space-y-2">
            <Label
              htmlFor="create-sched-name"
              className="text-xs font-semibold text-foreground/90 uppercase tracking-wide"
            >
              Nama Jadwal / Slot Absen
            </Label>
            <Input
              id="create-sched-name"
              placeholder="Misal: Absen Pagi"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              autoFocus
              className="w-full bg-background border-border hover:border-foreground/20 focus-visible:ring-primary/40 rounded-lg px-4 py-2 transition-all text-sm shadow-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/85">
                Tombol Absen Muncul
              </Label>
              <TimePicker
                value={windowStart}
                onChange={setWindowStart}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/85">
                Jam Masuk Resmi
              </Label>
              <TimePicker
                value={scheduleStart}
                onChange={setScheduleStart}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/85">
                Batas Toleransi Telat
              </Label>
              <TimePicker
                value={lateCutoff}
                onChange={setLateCutoff}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/85">
                Batas Akhir Absen
              </Label>
              <TimePicker
                value={scheduleEnd}
                onChange={setScheduleEnd}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-end items-stretch sm:items-center pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="w-full sm:w-auto rounded-lg hover:bg-muted font-medium transition-all"
            >
              Batal
            </Button>
            <Button
              type="submit"
              loading={isSubmitting}
              disabled={!name.trim() || isSubmitting}
              className="w-full sm:w-auto bg-primary hover:bg-primary/95 text-primary-foreground font-medium rounded-lg shadow-sm transition-all"
            >
              Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
