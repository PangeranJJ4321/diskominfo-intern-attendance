"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { id } from "date-fns/locale";
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
import type { UserAttendanceDetailDialogProps } from "@/interfaces/dashboard";
import type { Attendance } from "@/interfaces/models";
import { Map, MapMarker, MapTileLayer, MapGeoJSON } from "@/components/ui/map";
import { getAttendanceAreas } from "@/lib/services/attendance-areas";
import type { GeoJsonObject } from "geojson";
import { AttendanceStatus } from "@/interfaces/enums";

/**
 * Component for viewing user attendance details in a read-only dialog.
 *
 * @param props - Component properties.
 * @param props.open - Whether the dialog is open.
 * @param props.onOpenChange - Callback to handle opening/closing the dialog.
 * @param props.date - The selected attendance date.
 * @param props.schedule - The schedule configuration for this attendance date.
 * @param props.attendance - The recorded attendance model, if any.
 * @returns The rendered JSX element.
 */
export default function UserAttendanceDetailDialog({
  open,
  onOpenChange,
  date,
  schedule,
  attendance,
}: UserAttendanceDetailDialogProps) {
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

  if (!date || !schedule) return null;

  /**
   * Helper to render the stylized status badge based on attendance status.
   *
   * @param status - The attendance status.
   * @returns React JSX element representing the status badge.
   */
  const renderStatusBadge = (status: Attendance["status"]) => {
    switch (status) {
      case AttendanceStatus.PRESENT:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Hadir
          </span>
        );
      case AttendanceStatus.LATE:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
            Terlambat
          </span>
        );
      case AttendanceStatus.SICK:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-3 py-1 text-xs font-bold text-sky-600 dark:text-sky-400 border border-sky-500/20">
            <span className="size-1.5 rounded-full bg-sky-500" />
            Sakit
          </span>
        );
      case AttendanceStatus.EXCUSED:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/10 px-3 py-1 text-xs font-bold text-violet-600 dark:text-violet-400 border border-violet-500/20">
            <span className="size-1.5 rounded-full bg-violet-500" />
            Izin / Cuti
          </span>
        );
      case AttendanceStatus.ABSENT:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1 text-xs font-bold text-destructive border border-destructive/20">
            <span className="size-1.5 rounded-full bg-destructive" />
            Alpa
          </span>
        );
    }
  };

  /**
   * Helper to get the display badge of the current day's attendance status.
   *
   * @returns React JSX element representing status.
   */
  const getDisplayStatus = () => {
    if (attendance) {
      return renderStatusBadge(attendance.status);
    }

    const todayStr = format(new Date(), "yyyy-MM-dd");
    const dateStr = format(date, "yyyy-MM-dd");
    if (dateStr < todayStr) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1 text-xs font-bold text-destructive border border-destructive/20">
          <span className="size-1.5 rounded-full bg-destructive" />
          Alpa (Sistem)
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-muted border border-border px-3 py-1 text-xs font-semibold text-muted-foreground">
        <span className="size-1.5 rounded-full bg-muted-foreground/55" />
        Belum Absen
      </span>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90dvh] overflow-y-auto scrollbar-none p-4 sm:p-6">
        <DialogHeader className="space-y-1.5">
          <DialogTitle className="text-lg font-bold tracking-tight text-foreground/90">
            Detail Presensi
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground font-medium">
            Rincian data presensi Anda pada tanggal{" "}
            <strong className="text-foreground">
              {format(date, "dd MMMM yyyy", { locale: id })}
            </strong>
            .
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
        {attendance?.attendancePhotoUrl && (
          <div className="space-y-1.5 pt-3">
            <span className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
              <Camera className="size-3.5 text-muted-foreground" />
              Foto Bukti Presensi
            </span>
            <div className="relative aspect-video rounded-lg overflow-hidden border border-border bg-muted/40 flex items-center justify-center">
              <Image
                src={attendance.attendancePhotoUrl}
                alt="Foto Presensi"
                fill
                unoptimized={attendance.attendancePhotoUrl.startsWith('/uploads/')}
                sizes="(max-width: 640px) calc(95vw - 2rem), 26rem"
                className="object-cover animate-in fade-in zoom-in-95 duration-200"
              />
            </div>
          </div>
        )}

        {/* Map Display (if available) */}
        {attendance?.attendanceLatitude && attendance?.attendanceLongitude && (
          <div className="space-y-1.5 pt-3">
            <span className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
              <MapPin className="size-3.5 text-primary animate-pulse" />
              Lokasi Presensi
            </span>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${attendance.attendanceLatitude},${attendance.attendanceLongitude}`}
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
                    attendance.attendanceLatitude,
                    attendance.attendanceLongitude,
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
                      attendance.attendanceLatitude,
                      attendance.attendanceLongitude,
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

        <div className="space-y-4 pt-2">
          {/* Status Display */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-foreground/80 block">
              Status Presensi
            </span>
            <div className="flex items-center gap-4">
              {getDisplayStatus()}
              {attendance?.attendanceTime && (
                <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <Clock className="size-3.5 text-muted-foreground/75" />
                  Jam Absen: {attendance.attendanceTime}
                </span>
              )}
            </div>
          </div>

          {/* Notes Display */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-foreground/80 flex items-center gap-1">
              <FileText className="size-3.5" />
              Catatan / Keterangan
            </span>
            <div className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm shadow-sm min-h-20 text-foreground/90 whitespace-pre-wrap">
              {attendance?.notes || (
                <span className="text-muted-foreground/60 italic text-xs">
                  Tidak ada catatan.
                </span>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-end pt-2">
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto bg-primary hover:bg-primary/95 text-primary-foreground font-semibold rounded-lg text-xs h-9 shadow-sm"
          >
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
