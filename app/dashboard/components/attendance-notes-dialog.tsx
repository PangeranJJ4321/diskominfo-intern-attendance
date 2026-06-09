"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle } from "lucide-react";
import { type AttendanceNotesDialogProps } from "@/interfaces/dashboard";
import { AttendanceStatus } from "@/interfaces/enums";

/**
 * Dialog component for entering attendance notes (e.g. excuse for being late).
 *
 * @param props - Component properties.
 */
export default function AttendanceNotesDialog({
  open,
  onOpenChange,
  status,
  onSubmit,
  isSubmitting,
}: AttendanceNotesDialogProps) {
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => setNotes(""), 0);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const getTitle = () => {
    switch (status) {
      case AttendanceStatus.LATE:
        return "Alasan Terlambat";
      case AttendanceStatus.SICK:
        return "Ajukan Surat Sakit";
      case AttendanceStatus.EXCUSED:
        return "Permohonan Izin / Cuti";
      default:
        return "Catatan Presensi";
    }
  };

  const getDescription = () => {
    switch (status) {
      case AttendanceStatus.LATE:
        return "Harap berikan penjelasan singkat mengapa Anda terlambat melakukan presensi hari ini.";
      case AttendanceStatus.SICK:
        return "Berikan penjelasan mengenai sakit Anda. Anda dapat menyerahkan surat dokter ke admin nanti.";
      case AttendanceStatus.EXCUSED:
        return "Harap tuliskan keperluan permohonan izin atau cuti Anda secara rinci.";
      default:
        return "Masukkan keterangan tambahan untuk presensi Anda.";
    }
  };

  const handleSend = () => {
    onSubmit(notes);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90dvh] overflow-y-auto scrollbar-none p-4 sm:p-6">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            {getTitle()}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            {getDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label
              htmlFor="notes"
              className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
            >
              Keterangan / Alasan
            </label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                status === AttendanceStatus.LATE
                  ? "Contoh: Terjebak macet di jalan, ban bocor..."
                  : "Ketik alasan di sini..."
              }
              rows={4}
              className="resize-none border-border bg-background rounded-xl p-3 focus-visible:ring-1 text-sm text-foreground"
            />
          </div>

          {status === AttendanceStatus.LATE && (
            <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/15 text-amber-600 dark:text-amber-400 p-3 rounded-xl text-xs font-medium leading-relaxed">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>
                Presensi terlambat akan dicatat di database. Pastikan keterangan
                yang Anda masukkan valid.
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="rounded-xl text-xs h-9 font-semibold"
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={handleSend}
            loading={isSubmitting}
            disabled={!notes.trim()}
            className="rounded-xl text-xs h-9 font-semibold"
          >
            Kirim Presensi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
