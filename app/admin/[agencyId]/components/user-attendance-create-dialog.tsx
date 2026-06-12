"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { toast } from "sonner";
import { CalendarDays, Clock, FileText } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createAttendance } from "@/lib/services/attendances";
import { useAttendanceStore } from "@/stores/attendance-store";
import type { AttendanceStatusType } from "@/interfaces/enums";
import { AttendanceStatus } from "@/interfaces/enums";
import type { UserAttendanceCreateDialogProps } from "@/interfaces/admin";
import { TimePicker } from "@/components/custom/time-picker";

/**
 * Component for manually creating a user attendance record.
 *
 * @param props - Component properties.
 */
export default function UserAttendanceCreateDialog({
  open,
  onOpenChange,
  internId,
  userName,
  date,
  schedule,
  onSuccess,
}: UserAttendanceCreateDialogProps) {
  const [status, setStatus] = useState<AttendanceStatusType>(
    AttendanceStatus.PRESENT,
  );
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open && date) {
      const timer = setTimeout(() => {
        setStatus(AttendanceStatus.PRESENT);
        setTime(schedule ? schedule.scheduleStart : "08:00");
        setNotes("");
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [open, date, schedule]);

  /**
   * Handles saving the manual attendance record.
   *
   * @param e - Form event.
   */
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !schedule) return;

    setIsSubmitting(true);
    try {
      const formattedDate = format(date, "yyyy-MM-dd");
      const timeDate =
        (status === AttendanceStatus.PRESENT ||
          status === AttendanceStatus.LATE) &&
        time
          ? new Date(`${formattedDate}T${time}:00`)
          : null;

      const newAttendance = await createAttendance({
        internId,
        scheduleId: schedule.id,
        date: formattedDate,
        attendanceTime: timeDate ? timeDate.toISOString() : null,
        status,
        notes: notes.trim() || null,
      });

      toast.success("Presensi karyawan berhasil ditambahkan");
      useAttendanceStore.getState().upsertAttendance(newAttendance);
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : "Gagal menambahkan status presensi";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!date || !schedule) return null;

  const STATUS_OPTIONS: {
    value: AttendanceStatusType;
    label: string;
    className: string;
  }[] = [
    {
      value: AttendanceStatus.PRESENT,
      label: "Hadir",
      className: "rounded-md cursor-pointer text-emerald-600 font-medium",
    },
    {
      value: AttendanceStatus.LATE,
      label: "Terlambat",
      className: "rounded-md cursor-pointer text-amber-600 font-medium",
    },
    {
      value: AttendanceStatus.SICK,
      label: "Sakit",
      className: "rounded-md cursor-pointer text-sky-600 font-medium",
    },
    {
      value: AttendanceStatus.EXCUSED,
      label: "Izin / Cuti",
      className: "rounded-md cursor-pointer text-violet-600 font-medium",
    },
    {
      value: AttendanceStatus.ABSENT,
      label: "Alpa (Tidak Hadir)",
      className: "rounded-md cursor-pointer text-destructive font-medium",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90dvh] overflow-y-auto scrollbar-none p-4 sm:p-6">
        <DialogHeader className="space-y-1.5">
          <DialogTitle className="text-lg font-bold tracking-tight text-foreground/90">
            Tambah Presensi Manual
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground font-medium">
            Masukkan manual presensi untuk{" "}
            <strong className="text-foreground">{userName}</strong> pada tanggal{" "}
            {format(date, "dd MMMM yyyy", { locale: id })}.
          </DialogDescription>
        </DialogHeader>

        {/* Schedule Context Card */}
        <div className="bg-muted/30 border border-border rounded-lg p-3 space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 font-semibold text-foreground/80">
            <CalendarDays className="size-3.5 text-primary/70" />
            <span>{schedule.name}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 pl-5">
            <div className="flex items-center gap-1">
              <Clock className="size-3 text-muted-foreground/60" />
              <span>Jam Masuk: {schedule.scheduleStart}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="size-3 text-muted-foreground/60" />
              <span>Toleransi: {schedule.lateCutoff}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4 pt-2">
          {/* Status Selection */}
          <div className="space-y-1.5">
            <Label
              htmlFor="override-status"
              className="text-xs font-semibold text-foreground/80"
            >
              Status Presensi
            </Label>
            <Select
              value={status}
              onValueChange={(val) => setStatus(val as AttendanceStatusType)}
            >
              <SelectTrigger
                id="override-status"
                className="w-full rounded-lg bg-background border-border text-sm"
              >
                <SelectValue placeholder="Pilih Status" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border rounded-lg">
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    className={opt.className}
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Time Picker (only show for PRESENT or LATE) */}
          {(status === AttendanceStatus.PRESENT ||
            status === AttendanceStatus.LATE) && (
            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
              <Label className="text-xs font-semibold text-foreground/80">
                Jam Absen Datang
              </Label>
              <TimePicker
                value={time}
                onChange={setTime}
                disabled={isSubmitting}
              />
            </div>
          )}

          {/* Override Notes */}
          <div className="space-y-1.5">
            <Label
              htmlFor="override-notes"
              className="text-xs font-semibold text-foreground/80 flex items-center gap-1"
            >
              <FileText className="size-3.5" />
              Catatan / Keterangan Admin
            </Label>
            <Textarea
              id="override-notes"
              placeholder="Sebutkan alasan override, nomor surat cuti, atau info penunjang lainnya..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isSubmitting}
              className="w-full bg-background border-border hover:border-foreground/20 rounded-lg px-3 py-2 text-sm shadow-sm min-h-20"
            />
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-end items-stretch sm:items-center pt-2">
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="w-full sm:w-auto rounded-lg font-medium text-xs h-9"
              >
                Batal
              </Button>
              <Button
                type="submit"
                loading={isSubmitting}
                className="w-full sm:w-auto bg-primary hover:bg-primary/95 text-primary-foreground font-semibold rounded-lg text-xs h-9 shadow-sm"
              >
                Tambah Presensi
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
