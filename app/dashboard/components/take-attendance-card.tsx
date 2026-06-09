"use client";

import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  ChevronDown,
  Clock,
  XCircle,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@/components/ui/button-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

import { createAttendance } from "@/lib/services/attendances";
import type { TakeAttendanceCardProps } from "@/interfaces/dashboard";
import {
  AttendanceStatus,
  getAttendanceStatusLabel,
  getAttendanceStatusButtonStyles,
  type AttendanceStatusType,
} from "@/interfaces/enums";
import TakeAttendanceFaceCamera from "./take-attendance-face-camera";

function formatTimeLabel(value: string): string {
  return value.length >= 5 ? value.slice(0, 5) : value;
}

export default function TakeAttendanceCard({
  schedule,
  attendances,
  userId,
  userHasFaceRegistered,
  currentLocation,
  isWithinGeofence,
  onAttendanceSuccess,
  refreshTrigger,
  workDate,
  className,
}: TakeAttendanceCardProps) {
  // Live Clock State
  const [time, setTime] = useState<Date | null>(null);

  // Submitting States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFaceCameraOpen, setIsFaceCameraOpen] = useState(false);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [capturedDescriptor, setCapturedDescriptor] = useState<number[] | null>(
    null,
  );

  // Dialog / notes states
  const [selectedStatus, setSelectedStatus] =
    useState<AttendanceStatusType | null>(null);
  const [notes, setNotes] = useState("");

  // Update Clock
  useEffect(() => {
    const timer = setTimeout(() => setTime(new Date()), 0);
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  // Fetch database records
  useEffect(() => {}, [refreshTrigger]);

  const todayDateStr = useMemo(() => {
    if (workDate) return workDate;
    if (!time) return "";
    return format(time, "yyyy-MM-dd");
  }, [time, workDate]);

  // Find if today's attendance has already been recorded
  const attendanceRecord = useMemo(() => {
    if (!schedule || !todayDateStr) return null;
    return (
      attendances.find(
        (a) =>
          a.userId === userId &&
          a.scheduleId === schedule.id &&
          a.date === todayDateStr,
      ) || null
    );
  }, [attendances, schedule, userId, todayDateStr]);

  // Timing states
  const timingStates = useMemo(() => {
    if (!time) {
      return {
        isBeforeSchedule: false,
        isWithinTime: false,
        isLateNow: false,
        isAfterAllowedWindow: false,
        hasPassedTime: false,
      };
    }

    const windowStartStr = formatTimeLabel(schedule.windowStart);
    const lateCutoffStr = formatTimeLabel(schedule.lateCutoff);
    const scheduleEndStr = formatTimeLabel(schedule.scheduleEnd);
    const scheduleStartStr = formatTimeLabel(schedule.scheduleStart);

    const isOvernight = scheduleEndStr < windowStartStr;

    let absoluteWindowStart: Date;
    let absoluteLateCutoff: Date;
    let absoluteScheduleEnd: Date;
    let absoluteScheduleStart: Date;

    const workDateToUse = workDate || format(time, "yyyy-MM-dd");

    const parseLocal = (dStr: string, tStr: string) => {
      const [yyyy, mm, dd] = dStr.split("-").map(Number);
      const [hh, min, sec] = tStr.split(":").map(Number);
      return new Date(yyyy, mm - 1, dd, hh, min, sec || 0, 0);
    };

    if (isOvernight) {
      const parts = workDateToUse.split("-").map(Number);
      const startDay = new Date(parts[0], parts[1] - 1, parts[2]);
      const nextDay = new Date(startDay);
      nextDay.setDate(startDay.getDate() + 1);

      const nextDayDateStr = format(nextDay, "yyyy-MM-dd");

      absoluteWindowStart = parseLocal(workDateToUse, windowStartStr);
      absoluteScheduleStart = parseLocal(workDateToUse, scheduleStartStr);
      absoluteLateCutoff = parseLocal(
        lateCutoffStr < windowStartStr ? nextDayDateStr : workDateToUse,
        lateCutoffStr,
      );
      absoluteScheduleEnd = parseLocal(nextDayDateStr, scheduleEndStr);
    } else {
      absoluteWindowStart = parseLocal(workDateToUse, windowStartStr);
      absoluteScheduleStart = parseLocal(workDateToUse, scheduleStartStr);
      absoluteLateCutoff = parseLocal(workDateToUse, lateCutoffStr);
      absoluteScheduleEnd = parseLocal(workDateToUse, scheduleEndStr);
    }

    const isBeforeSchedule = time < absoluteWindowStart;
    const isWithinTime =
      time >= absoluteWindowStart && time < absoluteLateCutoff;
    const isLateNow = time >= absoluteLateCutoff && time < absoluteScheduleEnd;
    const isAfterAllowedWindow = time >= absoluteScheduleEnd;
    const hasPassedTime = time > absoluteScheduleStart;

    return {
      isBeforeSchedule,
      isWithinTime,
      isLateNow,
      isAfterAllowedWindow,
      hasPassedTime,
    };
  }, [schedule, time, workDate]);

  const { isBeforeSchedule, isWithinTime, isLateNow, isAfterAllowedWindow } =
    timingStates;

  const isAttendanceRecorded = attendanceRecord !== null;

  const canSubmitAttendance =
    time !== null &&
    !isSubmitting &&
    !isAttendanceRecorded &&
    !isAfterAllowedWindow &&
    !isBeforeSchedule;

  const canOpenAttendanceMenu = !isAttendanceRecorded && !isSubmitting;

  async function handleSubmitAttendance(
    status: AttendanceStatusType,
    attendanceNotes: string,
    attendanceFaceDescriptor: number[] | null = null,
    photoUrl: string | null = null,
  ) {
    if (!time) return;

    const isExcusedOrSick =
      status === AttendanceStatus.EXCUSED || status === AttendanceStatus.SICK;

    if (!isExcusedOrSick) {
      if (isWithinGeofence === null) {
        toast.error(
          "GPS belum terdeteksi. Silakan aktifkan GPS atau tunggu sebentar.",
        );
        return;
      }

      if (isWithinGeofence === false) {
        toast.error("Presensi wajib dilakukan di dalam area kantor.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const now = new Date();

      await createAttendance({
        userId,
        scheduleId: schedule.id,
        date: todayDateStr,
        attendanceTime: now.toISOString(),
        attendanceLatitude:
          !isExcusedOrSick && currentLocation ? currentLocation.latitude : null,
        attendanceLongitude:
          !isExcusedOrSick && currentLocation
            ? currentLocation.longitude
            : null,
        attendancePhotoUrl:
          status === AttendanceStatus.PRESENT ||
          status === AttendanceStatus.LATE
            ? (photoUrl ?? null)
            : null,
        attendanceFaceDescriptor:
          status === AttendanceStatus.PRESENT ||
          status === AttendanceStatus.LATE
            ? (attendanceFaceDescriptor ?? null)
            : null,
        status,
        notes: attendanceNotes.trim() ? attendanceNotes.trim() : null,
      });

      toast.success(
        `Presensi ${getAttendanceStatusLabel(status)} berhasil dikirim!`,
      );

      onAttendanceSuccess();
      setSelectedStatus(null);
      setNotes("");
      setCapturedPhotoUrl(null);
      setCapturedDescriptor(null);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Gagal mengirim presensi.";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleFaceDescriptorCaptured(
    photoUrl: string,
    faceDescriptor: number[],
  ) {
    setIsFaceCameraOpen(false);
    setCapturedPhotoUrl(photoUrl);
    setCapturedDescriptor(faceDescriptor);

    if (isLateNow) {
      setSelectedStatus(AttendanceStatus.LATE);
      setNotes("");
    } else {
      void handleSubmitAttendance(
        AttendanceStatus.PRESENT,
        "",
        faceDescriptor,
        photoUrl,
      );
    }
  }

  function openStatusDialog(status: AttendanceStatusType) {
    setSelectedStatus(status);
    setNotes("");
  }

  if (!time) {
    return (
      <Card
        className={cn(
          "border border-border/60 bg-card/45 backdrop-blur-md",
          className,
        )}
      >
        <CardContent className="flex h-full flex-col justify-between space-y-5 p-5">
          <div className="space-y-2">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-7 w-32 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "transition-all duration-300 hover:shadow-md border backdrop-blur-md",
        isAttendanceRecorded
          ? "border-border/60 bg-card/45"
          : isLateNow && !isAfterAllowedWindow
            ? "border-amber-500/40 bg-amber-500/5"
            : isWithinTime
              ? "border-emerald-500/40 bg-emerald-500/5"
              : "border-border/60 bg-card/45",
        className,
      )}
    >
      <CardContent className="flex h-full flex-col justify-between space-y-5 p-5">
        <div className="space-y-2">
          <h3 className="font-bold text-base md:text-lg text-foreground">
            {schedule.name}
          </h3>

          <div className="flex items-center text-xs md:text-sm text-muted-foreground gap-2 bg-muted/60 w-fit px-2.5 py-1 rounded-xl">
            <Clock className="size-4 text-primary" />
            <span className="font-semibold text-foreground">
              {formatTimeLabel(schedule.scheduleStart)} -{" "}
              {formatTimeLabel(schedule.scheduleEnd)} WITA
            </span>
          </div>

          {!isAttendanceRecorded && (
            <div
              className={cn(
                "flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-lg w-fit",
                isBeforeSchedule && "text-muted-foreground bg-muted/40",
                isWithinTime &&
                  "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
                isLateNow &&
                  "text-amber-600 dark:text-amber-400 bg-amber-500/10",
                isAfterAllowedWindow && "text-destructive bg-destructive/10",
              )}
            >
              {isBeforeSchedule && (
                <>
                  <Clock className="size-3" />
                  Belum masuk jam absen (mulai{" "}
                  {formatTimeLabel(schedule.windowStart)})
                </>
              )}
              {isWithinTime && (
                <>
                  <CheckCircle2 className="size-3" />
                  Tepat waktu — batas {formatTimeLabel(schedule.lateCutoff)}
                </>
              )}
              {isLateNow && (
                <>
                  <AlertTriangle className="size-3" />
                  Terlambat — batas {formatTimeLabel(schedule.scheduleEnd)}
                </>
              )}
              {isAfterAllowedWindow && (
                <>
                  <XCircle className="size-3" />
                  Waktu absen telah berakhir
                </>
              )}
            </div>
          )}
        </div>

        <div className="space-y-2.5">
          <ButtonGroup className="w-full shadow-sm rounded-xl overflow-hidden">
            <Button
              className={cn(
                "flex-1 text-xs font-bold h-10 transition-all",
                isLateNow &&
                  canSubmitAttendance &&
                  "border-amber-500 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 hover:text-amber-700",
                isAttendanceRecorded && "disabled:opacity-100",
                isAttendanceRecorded &&
                  getAttendanceStatusButtonStyles(attendanceRecord.status),
              )}
              disabled={!canSubmitAttendance}
              onClick={() => setIsFaceCameraOpen(true)}
              loading={isSubmitting}
              type="button"
              variant={
                isAttendanceRecorded || isAfterAllowedWindow || isBeforeSchedule
                  ? "secondary"
                  : isLateNow
                    ? "outline"
                    : "default"
              }
            >
              {isAttendanceRecorded ? (
                <>
                  <CheckCircle2 className="mr-2 size-4 animate-in zoom-in" />
                  {getAttendanceStatusLabel(attendanceRecord.status)}
                </>
              ) : isAfterAllowedWindow ? (
                <>
                  <XCircle className="mr-2 size-4" />
                  Waktu Habis
                </>
              ) : isBeforeSchedule ? (
                <>
                  <XCircle className="mr-2 size-4" />
                  Di Luar Jam
                </>
              ) : isWithinTime ? (
                <>
                  <CheckCircle2 className="mr-2 size-4" />
                  Isi Presensi
                </>
              ) : isLateNow ? (
                <>
                  <Clock className="mr-2 size-4" />
                  Isi Presensi Terlambat
                </>
              ) : (
                <>
                  <XCircle className="mr-2 size-4" />
                  Di Luar Jam
                </>
              )}
            </Button>

            {!isAttendanceRecorded && canOpenAttendanceMenu && (
              <>
                <ButtonGroupSeparator />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      aria-label="Pilih status presensi lain"
                      className={cn(
                        "px-3 h-10 focus-visible:z-10",
                        isLateNow &&
                          canSubmitAttendance &&
                          "border-amber-500 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 hover:text-amber-700",
                      )}
                      disabled={!canOpenAttendanceMenu}
                      type="button"
                      variant={
                        isLateNow
                          ? "outline"
                          : isBeforeSchedule || isAfterAllowedWindow
                            ? "outline"
                            : "default"
                      }
                    >
                      <ChevronDown className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="min-w-44 rounded-xl p-1.5 border border-border/50 bg-card"
                  >
                    <DropdownMenuItem
                      className="cursor-pointer gap-2 py-2 px-3 rounded-lg text-xs font-semibold"
                      onSelect={(event) => {
                        event.preventDefault();
                        openStatusDialog(AttendanceStatus.EXCUSED);
                      }}
                    >
                      <Calendar className="size-3.5 text-primary" />
                      Izin
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer gap-2 py-2 px-3 rounded-lg text-xs font-semibold"
                      onSelect={(event) => {
                        event.preventDefault();
                        openStatusDialog(AttendanceStatus.SICK);
                      }}
                    >
                      <Calendar className="size-3.5 text-rose-500" />
                      Sakit
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </ButtonGroup>
        </div>
      </CardContent>

      <Dialog
        open={selectedStatus !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedStatus(null);
            setNotes("");
          }
        }}
      >
        <DialogContent className="w-[95vw] sm:max-w-md max-h-[90dvh] overflow-y-auto scrollbar-none p-4 sm:p-6">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <Calendar className="size-5 text-primary" />
              {selectedStatus === AttendanceStatus.LATE
                ? "Isi Presensi Terlambat"
                : selectedStatus === AttendanceStatus.SICK
                  ? "Ajukan Sakit"
                  : "Ajukan Izin"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              {selectedStatus === AttendanceStatus.LATE
                ? "Tambahkan catatan singkat untuk presensi terlambat ini."
                : "Tambahkan catatan bila perlu sebelum mengirim presensi."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <label
              className="text-xs font-bold text-foreground"
              htmlFor="attendance-notes"
            >
              Catatan
            </label>
            <Textarea
              id="attendance-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Tambahkan keterangan..."
              rows={4}
              className="rounded-xl border-border/50"
            />
          </div>

          <DialogFooter className="flex justify-end gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedStatus(null)}
              disabled={isSubmitting}
              className="rounded-xl text-xs h-9 font-semibold"
            >
              Batal
            </Button>
            <Button
              loading={isSubmitting}
              onClick={() => {
                if (!selectedStatus) return;
                void handleSubmitAttendance(
                  selectedStatus,
                  notes,
                  capturedDescriptor,
                  capturedPhotoUrl,
                );
              }}
              type="button"
              className="rounded-xl text-xs h-9 font-semibold"
            >
              Kirim
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TakeAttendanceFaceCamera
        open={isFaceCameraOpen}
        onOpenChange={setIsFaceCameraOpen}
        userHasFaceRegistered={userHasFaceRegistered}
        onSuccess={handleFaceDescriptorCaptured}
      />
    </Card>
  );
}
