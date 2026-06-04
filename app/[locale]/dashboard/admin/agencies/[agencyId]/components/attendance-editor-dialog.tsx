"use client";

import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { type AttendanceStatus } from "@/lib/generated/prisma/enums";
import {
  attendanceSchema,
  createAttendanceSchema,
  updateAttendanceSchema,
} from "@/lib/schemas/attendance";

type AttendanceRecord = z.infer<typeof attendanceSchema>;

export type AttendanceEditorTarget = AttendanceRecord & {
  agencySchedule: {
    id: string;
    name: string;
    agencyScheduleStart: string;
    agencyScheduleEnd: string;
    dayOfWeek: number;
  };
  source: "real" | "synthetic";
};

type AttendanceEditorDialogProps = {
  open: boolean;
  attendance: AttendanceEditorTarget | null;
  intern: {
    id: string;
    name: string;
    email: string;
  } | null;
  isSaving: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (values: {
    status: AttendanceStatus;
    notes: string;
  }) => Promise<void>;
};

const STATUS_OPTIONS: Array<{ value: AttendanceStatus; label: string }> = [
  { value: "PRESENT", label: "Hadir" },
  { value: "LATE", label: "Terlambat" },
  { value: "EXCUSED", label: "Izin" },
  { value: "ABSENT", label: "Alpa" },
];

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  PRESENT: "Hadir",
  LATE: "Terlambat",
  EXCUSED: "Izin",
  ABSENT: "Alpa",
};

const STATUS_VARIANTS: Record<
  AttendanceStatus,
  "success-light" | "warning-light" | "info-light" | "destructive-light"
> = {
  PRESENT: "success-light",
  LATE: "warning-light",
  EXCUSED: "info-light",
  ABSENT: "destructive-light",
};

function formatOptionalDate(value: Date | null | undefined): string {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function normalizeNotes(value: string): string {
  return value.trim();
}

function getDialogLabel(attendance: AttendanceEditorTarget): string {
  return attendance.source === "synthetic" ? "Catatan baru" : "Catatan absensi";
}

type AttendanceEditorFormProps = AttendanceEditorDialogProps & {
  attendance: AttendanceEditorTarget;
  intern: {
    id: string;
    name: string;
    email: string;
  };
};

function getInitialStatus(
  attendance: AttendanceEditorTarget,
): AttendanceStatus {
  return attendance.status ?? "ABSENT";
}

function getInitialNotes(attendance: AttendanceEditorTarget): string {
  return attendance.source === "synthetic" ? "" : (attendance.notes ?? "");
}

function AttendanceEditorForm({
  attendance,
  intern,
  isSaving,
  onOpenChange,
  onSave,
}: AttendanceEditorFormProps): React.JSX.Element {
  const [status, setStatus] = useState<AttendanceStatus>(() =>
    getInitialStatus(attendance),
  );
  const [notes, setNotes] = useState<string>(() => getInitialNotes(attendance));

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedNotes = normalizeNotes(notes);
    const parsed =
      attendance.id && attendance.source === "real"
        ? updateAttendanceSchema.safeParse({
            status,
            notes: normalizedNotes.length > 0 ? normalizedNotes : null,
          })
        : createAttendanceSchema.safeParse({
            internId: attendance.internId,
            agencyScheduleId: attendance.agencyScheduleId,
            date: attendance.date,
            status,
            notes: normalizedNotes.length > 0 ? normalizedNotes : null,
          });

    if (!parsed.success) {
      toast.error("Validasi data absensi gagal");
      return;
    }

    try {
      const nextStatus = parsed.data.status ?? status;

      await onSave({
        status: nextStatus,
        notes: parsed.data.notes ?? "",
      });
    } catch {
      // Parent already handles rollback and feedback.
    }
  };

  return (
    <DialogContent className="sm:max-w-3xl">
      <DialogHeader>
        <DialogTitle>{getDialogLabel(attendance)}</DialogTitle>
        <DialogDescription>
          Lihat detail absensi dan ubah statusnya secara manual jika diperlukan.
        </DialogDescription>
      </DialogHeader>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3 rounded-xl border bg-muted/20 p-4">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Peserta
              </p>
              <p className="font-semibold">{intern.name}</p>
              <p className="text-sm text-muted-foreground">{intern.email}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Jadwal
              </p>
              <p className="font-semibold">{attendance.agencySchedule.name}</p>
              <p className="text-sm text-muted-foreground">
                {attendance.agencySchedule.agencyScheduleStart.slice(0, 5)} -{" "}
                {attendance.agencySchedule.agencyScheduleEnd.slice(0, 5)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Tanggal
              </p>
              <p className="font-semibold">
                {formatOptionalDate(attendance.date)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Status Saat Ini
              </p>
              <Badge variant={STATUS_VARIANTS[attendance.status]} size="sm">
                {STATUS_LABELS[attendance.status]}
              </Badge>
            </div>
          </div>

          <div className="space-y-3 rounded-xl border bg-background p-4">
            <div className="grid gap-3 text-sm">
              <div className="grid grid-cols-[140px_1fr] gap-2">
                <span className="text-muted-foreground">Waktu absensi</span>
                <span>{formatOptionalDate(attendance.attendanceTime)}</span>
              </div>
              <div className="grid grid-cols-[140px_1fr] gap-2">
                <span className="text-muted-foreground">Koordinat</span>
                <span>
                  {attendance.attendanceLatitude !== null &&
                  attendance.attendanceLongitude !== null
                    ? `${attendance.attendanceLatitude.toFixed(6)}, ${attendance.attendanceLongitude.toFixed(6)}`
                    : "-"}
                </span>
              </div>
              <div className="grid grid-cols-[140px_1fr] gap-2">
                <span className="text-muted-foreground">Deskriptor wajah</span>
                <span>
                  {attendance.attendanceFaceDescriptor
                    ? `${attendance.attendanceFaceDescriptor.length} nilai`
                    : "-"}
                </span>
              </div>
              <div className="grid grid-cols-[140px_1fr] gap-2">
                <span className="text-muted-foreground">Dibuat</span>
                <span>{formatOptionalDate(attendance.createdAt)}</span>
              </div>
              <div className="grid grid-cols-[140px_1fr] gap-2">
                <span className="text-muted-foreground">Diperbarui</span>
                <span>{formatOptionalDate(attendance.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[180px_1fr] md:items-start">
          <div className="space-y-2">
            <Label htmlFor="attendance-status">Status</Label>
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as AttendanceStatus)}
            >
              <SelectTrigger id="attendance-status" className="w-full">
                <SelectValue placeholder="Pilih status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="attendance-notes">Catatan</Label>
            <Textarea
              id="attendance-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Tambahkan catatan manual jika diperlukan"
              className="min-h-28"
            />
          </div>
        </div>

        <DialogFooter>
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </div>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

/**
 * Shows attendance details and lets admins change the attendance status manually.
 */
export function AttendanceEditorDialog({
  open,
  attendance,
  intern,
  isSaving,
  onOpenChange,
  onSave,
}: AttendanceEditorDialogProps): React.JSX.Element | null {
  if (!attendance || !intern) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <AttendanceEditorForm
        key={attendance.id}
        open={open}
        attendance={attendance}
        intern={intern}
        isSaving={isSaving}
        onOpenChange={onOpenChange}
        onSave={onSave}
      />
    </Dialog>
  );
}
