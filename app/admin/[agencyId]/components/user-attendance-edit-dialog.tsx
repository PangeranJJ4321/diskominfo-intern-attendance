"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { toast } from "sonner";
import { CalendarDays, Clock, FileText, MapPin, Camera } from "lucide-react";

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
import { updateAttendance } from "@/lib/services/attendances";
import { useAttendanceStore } from "@/stores/attendance-store";
import type { AttendanceStatusType } from "@/interfaces/enums";
import { AttendanceStatus } from "@/interfaces/enums";
import type { UserAttendanceEditDialogProps } from "@/interfaces/admin";
import { Map, MapMarker, MapTileLayer, MapGeoJSON } from "@/components/ui/map";
import { getAttendanceAreas } from "@/lib/services/attendance-areas";
import type { GeoJsonObject } from "geojson";

/**
 * Component for editing an existing user attendance record.
 *
 * @param props - Component properties.
 */
export default function UserAttendanceEditDialog({
  open,
  onOpenChange,
  userName,
  date,
  schedule,
  existingAttendance,
}: Omit<UserAttendanceEditDialogProps, "internId">) {
  const [status, setStatus] = useState<AttendanceStatusType>(
    AttendanceStatus.PRESENT,
  );
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [geofence, setGeofence] = useState<GeoJsonObject | null>(null);

  useEffect(() => {
    if (open) {
      getAttendanceAreas()
        .then((areas) => {
          if (areas.length > 0 && areas[0].geoData) {
            setGeofence(areas[0].geoData as GeoJsonObject);
          }
        })
        .catch((err) => {
          console.error("Gagal memuat area presensi:", err);
        });
    }
  }, [open]);

  useEffect(() => {
    if (open && date && existingAttendance) {
      const timer = setTimeout(() => {
        setStatus(existingAttendance.status);
        setNotes(existingAttendance.notes || "");
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [open, date, existingAttendance]);

  /**
   * Handles saving the changes to the attendance record.
   *
   * @param e - Form event.
   */
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !schedule || !existingAttendance) return;

    setIsSubmitting(true);
    try {
      const formattedDate = format(date, "yyyy-MM-dd");
      const timeStr =
        existingAttendance.attendanceTime || schedule.scheduleStart;
      const timeDate =
        (status === AttendanceStatus.PRESENT ||
          status === AttendanceStatus.LATE) &&
        timeStr
          ? new Date(`${formattedDate}T${timeStr}:00`)
          : null;

      const updated = await updateAttendance(existingAttendance.id, {
        status,
        attendanceTime: timeDate ? timeDate.toISOString() : null,
        notes: notes.trim() || null,
      });

      toast.success("Presensi karyawan berhasil diperbarui");
      useAttendanceStore.getState().upsertAttendance(updated);
      onOpenChange(false);
    } catch (err) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : "Gagal memperbarui status presensi";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!date || !schedule || !existingAttendance) return null;

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
            Ubah Status Presensi
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground font-medium">
            Ubah data presensi untuk{" "}
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

        {/* Photo Display (if available) */}
        {existingAttendance.attendancePhotoUrl && (
          <div className="space-y-1.5 pt-3">
            <span className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
              <Camera className="size-3.5 text-muted-foreground" />
              Foto Bukti Presensi
            </span>
            <div className="relative aspect-video rounded-lg overflow-hidden border border-border bg-muted/40 flex items-center justify-center">
              <Image
                src={existingAttendance.attendancePhotoUrl}
                alt="Foto Presensi"
                fill
                sizes="(max-width: 640px) calc(95vw - 2rem), 26rem"
                className="object-cover animate-in fade-in zoom-in-95 duration-200"
              />
            </div>
          </div>
        )}

        {/* Map Display (if available) */}
        {existingAttendance.attendanceLatitude &&
          existingAttendance.attendanceLongitude && (
            <div className="space-y-1.5 pt-3">
              <span className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                <MapPin className="size-3.5 text-primary animate-pulse" />
                Lokasi Presensi
              </span>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${existingAttendance.attendanceLatitude},${existingAttendance.attendanceLongitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block relative h-44 w-full rounded-lg overflow-hidden border border-border bg-muted/40 shadow-inner group cursor-pointer"
              >
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors z-20 flex items-center justify-center">
                  <span className="text-white text-xs font-semibold px-2.5 py-1.5 rounded-md bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-sm z-30">
                    Buka di Google Maps
                  </span>
                </div>
                <div className="pointer-events-none size-full">
                  <Map
                    center={[
                      existingAttendance.attendanceLatitude,
                      existingAttendance.attendanceLongitude,
                    ]}
                    zoom={16}
                    scrollWheelZoom={false}
                    doubleClickZoom={false}
                    boxZoom={false}
                    keyboard={false}
                    dragging={false}
                    touchZoom={false}
                    className="h-full w-full rounded-lg min-h-0"
                  >
                    <MapTileLayer />
                    <MapMarker
                      position={[
                        existingAttendance.attendanceLatitude,
                        existingAttendance.attendanceLongitude,
                      ]}
                    />
                    {geofence && (
                      <MapGeoJSON
                        data={geofence}
                        style={{
                          color: "var(--color-primary)",
                          weight: 3,
                          opacity: 0.8,
                          fillColor: "var(--color-primary)",
                          fillOpacity: 0.15,
                        }}
                      />
                    )}
                  </Map>
                </div>
              </a>
            </div>
          )}

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
                Simpan Perubahan
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
