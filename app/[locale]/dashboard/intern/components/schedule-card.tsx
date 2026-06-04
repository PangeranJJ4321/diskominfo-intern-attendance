"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  ChevronDown,
  Clock,
  Loader2,
  XCircle,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import FaceRecognitionScanner from "./face-recognition-scanner-dialog";
import { useLocationContext } from "../context/location-context";
import { useAttendanceContext } from "../context/attendance-context";
import { isLocationWithinArea } from "@/lib/location-within-area";
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
import { z } from "zod";
import { AttendanceStatus } from "@/lib/generated/prisma/enums";
import { agencyAreaSchema } from "@/lib/schemas/agency-area";
import { agencyRuleSchema } from "@/lib/schemas/agency-rule";
import { agencyScheduleSchema } from "@/lib/schemas/agency-schedule";
import { attendanceSchema } from "@/lib/schemas/attendance";

type Schedule = z.infer<typeof agencyScheduleSchema>;
type AttendanceRecord = z.infer<typeof attendanceSchema>;
type AgencyRule = z.infer<typeof agencyRuleSchema>;
type AttendanceStatusValue = Exclude<
  z.infer<typeof attendanceSchema>["status"],
  typeof AttendanceStatus.ABSENT
>;

const attendanceResponseSchema = z.object({
  data: z.array(attendanceSchema),
});

const agencyRuleResponseSchema = agencyRuleSchema.nullable();
const agencyAreaResponseSchema = agencyAreaSchema.nullable();

interface ScheduleCardProps {
  schedule: Schedule;
  internId: string;
  agencyId: string;
  className?: string;
}

function formatTimeLabel(value: string): string {
  return value.length >= 5 ? value.slice(0, 5) : value;
}

function parseTimeToMinutes(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);

  return hours * 60 + minutes;
}

function getMinutesInTimeZone(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    timeZone,
  }).formatToParts(date);

  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(
    parts.find((part) => part.type === "minute")?.value ?? "0",
  );

  return hour * 60 + minute;
}

function getTodayWindow(): { startDate: Date; endDate: Date } {
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 1);
  endDate.setMilliseconds(endDate.getMilliseconds() - 1);

  return { startDate, endDate };
}

function isAfterScheduleEnd(scheduleEnd: string, timeZone: string): boolean {
  const currentMinutes = getMinutesInTimeZone(new Date(), timeZone);
  const endMinutes = parseTimeToMinutes(scheduleEnd);

  return currentMinutes > endMinutes;
}

function isWithinLateWindow(
  scheduleEnd: string,
  lateToleranceMinutes: number,
  timeZone: string,
): boolean {
  const currentMinutes = getMinutesInTimeZone(new Date(), timeZone);
  const endMinutes = parseTimeToMinutes(scheduleEnd);
  const lateWindowEndMinutes = endMinutes + lateToleranceMinutes;

  return currentMinutes > endMinutes && currentMinutes <= lateWindowEndMinutes;
}

async function fetchJson<T>(
  url: string,
  schema: z.ZodType<T>,
): Promise<T | null> {
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    return null;
  }

  return schema.parse(await response.json());
}

function statusLabel(status: AttendanceStatus): string {
  switch (status) {
    case AttendanceStatus.PRESENT:
      return "Hadir";
    case AttendanceStatus.LATE:
      return "Terlambat";
    case AttendanceStatus.EXCUSED:
      return "Izin";
    case AttendanceStatus.ABSENT:
      return "Alpa";
  }
}

function dialogTitle(status: AttendanceStatusValue): string {
  return status === AttendanceStatus.LATE
    ? "Isi Kehadiran Terlambat"
    : "Ajukan Izin";
}

export function ScheduleCard({
  schedule,
  internId,
  agencyId,
  className,
}: ScheduleCardProps) {
  const [isWithinTime, setIsWithinTime] = useState(false);
  const [isLateTime, setIsLateTime] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFaceScannerOpen, setIsFaceScannerOpen] = useState(false);
  const [attendanceRecord, setAttendanceRecord] =
    useState<AttendanceRecord | null>(null);
  const [agencyRule, setAgencyRule] = useState<AgencyRule | null>(null);
  const [agencyTimeZone, setAgencyTimeZone] = useState("Asia/Makassar");
  const [selectedStatus, setSelectedStatus] =
    useState<AttendanceStatusValue | null>(null);
  const [notes, setNotes] = useState("");
  const { currentLocation, areaGeoData } = useLocationContext();
  const { markUpdated } = useAttendanceContext();

  useEffect(() => {
    let isActive = true;

    const checkTime = () => {
      if (!isActive) {
        return;
      }

      const currentTotalMinutes = getMinutesInTimeZone(
        new Date(),
        agencyTimeZone,
      );
      const startTotalMinutes = parseTimeToMinutes(
        schedule.agencyScheduleStart,
      );
      const endTotalMinutes = parseTimeToMinutes(schedule.agencyScheduleEnd);
      const lateToleranceMinutes = agencyRule?.lateToleranceMinutes ?? 0;

      setIsWithinTime(
        currentTotalMinutes >= startTotalMinutes &&
          currentTotalMinutes <= endTotalMinutes,
      );

      setIsLateTime(
        currentTotalMinutes > endTotalMinutes &&
          currentTotalMinutes <= endTotalMinutes + lateToleranceMinutes,
      );
    };

    checkTime();
    const interval = window.setInterval(checkTime, 5000);

    return () => {
      isActive = false;
      window.clearInterval(interval);
    };
  }, [
    agencyRule?.lateToleranceMinutes,
    agencyTimeZone,
    schedule.agencyScheduleEnd,
    schedule.agencyScheduleStart,
  ]);

  useEffect(() => {
    let isActive = true;

    async function loadAttendanceState() {
      setIsLoadingData(true);

      try {
        const { startDate, endDate } = getTodayWindow();

        // Ditambahkan parameter page=1 agar tableQuerySchema di backend tidak error
        const [attendanceData, ruleData, agencyAreaData] = await Promise.all([
          fetchJson(
            `/api/attendances?internId=${internId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&page=1&limit=100`,
            attendanceResponseSchema,
          ),
          fetchJson(`/api/agency-rules/${agencyId}`, agencyRuleResponseSchema),
          fetchJson(`/api/agency-areas/${agencyId}`, agencyAreaResponseSchema),
        ]);

        if (!isActive) {
          return;
        }

        setAgencyTimeZone(agencyAreaData?.timezone ?? "Asia/Makassar");

        const matchingAttendance =
          attendanceData?.data.find(
            (attendance) => attendance.agencyScheduleId === schedule.id,
          ) ?? null;

        setAttendanceRecord(matchingAttendance);
        setAgencyRule(ruleData);
      } catch (error) {
        console.error("Failed to load attendance state:", error);
      } finally {
        if (isActive) {
          setIsLoadingData(false);
        }
      }
    }

    void loadAttendanceState();

    return () => {
      isActive = false;
    };
  }, [agencyId, internId, schedule.id]);

  const hasPassedTime = isAfterScheduleEnd(
    schedule.agencyScheduleEnd,
    agencyTimeZone,
  );
  const isAttendanceRecorded = attendanceRecord !== null;
  const hasAgencyRule = agencyRule !== null;
  const requiresFaceVerification = agencyRule?.requireFaceVerification === true;
  const requiresWithinArea = agencyRule?.requireWithinArea !== false;
  const lateToleranceMinutes = agencyRule?.lateToleranceMinutes ?? 0;
  const isLateNow = isLateTime;
  const isBeforeSchedule = !isWithinTime && !isLateTime && !hasPassedTime;
  const isAfterAllowedWindow =
    hasPassedTime &&
    !isLateNow &&
    !isWithinTime &&
    !isWithinLateWindow(
      schedule.agencyScheduleEnd,
      lateToleranceMinutes,
      agencyTimeZone,
    );
  const attendanceWithinArea =
    requiresWithinArea && currentLocation && areaGeoData
      ? isLocationWithinArea(
          currentLocation.latitude,
          currentLocation.longitude,
          areaGeoData,
        )
      : null;
  const canSubmitAttendance =
    !isLoadingData &&
    !isSubmitting &&
    !isAttendanceRecorded &&
    hasAgencyRule &&
    !isAfterAllowedWindow &&
    !isBeforeSchedule;

  const canOpenAttendanceMenu = canSubmitAttendance;
  const attendanceActionLabel = isLateNow
    ? "Isi Kehadiran Terlambat"
    : "Isi Kehadiran";
  const attendanceHelperText = isLateNow
    ? `Tombol tetap aktif. Absensi yang dikirim sekarang akan dicatat sebagai terlambat setelah ${formatTimeLabel(schedule.agencyScheduleStart)} + ${lateToleranceMinutes} menit.`
    : `Tombol aktif hanya pada rentang jam ${formatTimeLabel(schedule.agencyScheduleStart)} - ${formatTimeLabel(schedule.agencyScheduleEnd)}.`;

  async function handleSubmitAttendance(
    status: AttendanceStatusValue,
    attendanceNotes: string,
    attendanceFaceDescriptor: number[] | null = null,
  ) {
    if (!canSubmitAttendance) {
      return;
    }

    // Skip location checks for EXCUSED status (Izin can be submitted from anywhere)
    const isExcused = status === AttendanceStatus.EXCUSED;

    if (!isExcused) {
      if (requiresWithinArea && !currentLocation) {
        toast.error(
          "Lokasi belum tersedia. Aktifkan pelacakan lokasi di peta terlebih dahulu.",
        );
        return;
      }

      if (requiresWithinArea && attendanceWithinArea === null) {
        toast.error(
          "Area dinas belum tersedia. Muat peta area terlebih dahulu.",
        );
        return;
      }

      if (requiresWithinArea && attendanceWithinArea === false) {
        toast.error("Absensi wajib dilakukan di dalam area dinas.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const now = new Date();
      // Mengonversi tanggal lokal saat ini ke representasi UTC pada jam 00:00 (midnight)
      // Ini dibutuhkan agar di route.ts validasi ke tabel `AgencyHoliday` berjalan dengan akurat
      const dateForServer = new Date(
        Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()),
      );

      const response = await fetch("/api/attendances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          internId,
          agencyScheduleId: schedule.id,
          date: dateForServer.toISOString(),
          attendanceTime: now.toISOString(),
          attendanceLatitude: currentLocation?.latitude ?? null,
          attendanceLongitude: currentLocation?.longitude ?? null,
          attendanceFaceDescriptor,
          status,
          notes: attendanceNotes.trim() ? attendanceNotes.trim() : null,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData?.error || "Gagal mengisi kehadiran");
      }

      const parsedAttendance = attendanceSchema.parse(responseData);
      setAttendanceRecord(parsedAttendance);
      setSelectedStatus(null);
      setNotes("");
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("attendance:created", {
            detail: {
              internId,
              agencyScheduleId: schedule.id,
              attendance: parsedAttendance,
            },
          }),
        );
      }
      markUpdated(internId);
      toast.success("Kehadiran berhasil dikirim");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal mengirim data";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function openFaceScanner() {
    setIsFaceScannerOpen(true);
  }

  function handleFaceDescriptorCaptured(faceDescriptor: number[]) {
    void handleSubmitAttendance(AttendanceStatus.PRESENT, "", faceDescriptor);
  }

  function openStatusDialog(status: AttendanceStatusValue) {
    setSelectedStatus(status);
    setNotes("");
  }

  return (
    <Card className={cn("transition-all hover:shadow-md", className)}>
      <CardContent className="flex h-full flex-col justify-between space-y-5 p-5">
        <div className="space-y-1.5">
          <h3 className="font-semibold text-lg">{schedule.name}</h3>
          <div className="flex items-center text-sm text-muted-foreground gap-2 bg-muted/50 w-fit px-2 py-1 rounded-md">
            <Clock className="size-4 text-primary" />
            <span className="font-medium">
              {formatTimeLabel(schedule.agencyScheduleStart)} -{" "}
              {formatTimeLabel(schedule.agencyScheduleEnd)}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <ButtonGroup className="w-full">
            <Button
              className={cn(
                "flex-1",
                isLateNow &&
                  canSubmitAttendance &&
                  "bg-amber-500 hover:bg-amber-600 text-white",
              )}
              disabled={!canSubmitAttendance}
              onClick={() => {
                if (requiresFaceVerification) {
                  openFaceScanner();
                  return;
                }

                void handleSubmitAttendance(AttendanceStatus.PRESENT, "");
              }}
              type="button"
              variant={
                isAttendanceRecorded || isAfterAllowedWindow
                  ? "secondary"
                  : isLateNow
                    ? "outline"
                    : "default"
              }
            >
              {isSubmitting ? (
                <>
                  <Spinner className="mr-2 size-4" />
                  Mengirim...
                </>
              ) : isAttendanceRecorded ? (
                <>
                  <CheckCircle2 className="mr-2 size-4" />
                  {statusLabel(
                    attendanceRecord?.status ?? AttendanceStatus.PRESENT,
                  )}
                </>
              ) : hasPassedTime ? (
                isLateNow ? (
                  <>
                    <Clock className="mr-2 size-4" />
                    Terlambat - {attendanceActionLabel}
                  </>
                ) : (
                  <>
                    <XCircle className="mr-2 size-4" />
                    Waktu Habis
                  </>
                )
              ) : isBeforeSchedule ? (
                <>
                  <XCircle className="mr-2 size-4" />
                  Di Luar Jam
                </>
              ) : requiresFaceVerification ? (
                <>
                  <CheckCircle2 className="mr-2 size-4" />
                  {attendanceActionLabel}
                </>
              ) : isWithinTime ? (
                <>
                  <CheckCircle2 className="mr-2 size-4" />
                  {attendanceActionLabel}
                </>
              ) : (
                <>
                  <XCircle className="mr-2 size-4" />
                  Di Luar Jam
                </>
              )}
            </Button>
            <ButtonGroupSeparator />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  aria-label="Pilih status kehadiran lain"
                  className={cn(
                    "px-3",
                    isLateNow &&
                      canSubmitAttendance &&
                      "bg-amber-500 hover:bg-amber-600 text-white",
                  )}
                  disabled={!canOpenAttendanceMenu}
                  type="button"
                  variant={
                    isAttendanceRecorded || hasPassedTime
                      ? "secondary"
                      : isLateNow
                        ? "outline"
                        : "default"
                  }
                >
                  <ChevronDown className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-44">
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    openStatusDialog(AttendanceStatus.EXCUSED);
                  }}
                >
                  Izin
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </ButtonGroup>

          {isAttendanceRecorded ? (
            <p className="text-xs text-muted-foreground">
              Kehadiran tersimpan sebagai {statusLabel(attendanceRecord.status)}
              .
            </p>
          ) : hasPassedTime ? (
            <p className="text-xs text-muted-foreground">
              Waktu pengisian untuk jadwal ini sudah berakhir.
            </p>
          ) : requiresFaceVerification ? (
            <p className="text-xs text-muted-foreground">
              Aturan dinas ini mewajibkan verifikasi wajah sebelum absensi hadir
              bisa dikirim.
            </p>
          ) : !hasAgencyRule ? (
            <p className="text-xs text-muted-foreground">
              Aturan dinas belum tersedia, sehingga absensi dari jadwal ini
              belum bisa dikirim.
            </p>
          ) : !isWithinTime && !isLateNow ? (
            <p className="text-xs text-muted-foreground">
              {attendanceHelperText}
            </p>
          ) : isLateNow ? (
            <p className="text-xs text-muted-foreground">
              {attendanceHelperText}
            </p>
          ) : null}
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedStatus ? dialogTitle(selectedStatus) : "Isi Kehadiran"}
            </DialogTitle>
            <DialogDescription>
              {selectedStatus === AttendanceStatus.LATE
                ? "Tambahkan catatan singkat untuk absensi terlambat ini."
                : "Tambahkan catatan bila perlu sebelum mengirim absensi."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="attendance-notes">
              Catatan
            </label>
            <Textarea
              id="attendance-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Opsional"
              rows={4}
            />
          </div>

          {requiresFaceVerification &&
          selectedStatus !== AttendanceStatus.EXCUSED ? (
            <p className="text-sm text-muted-foreground">
              Aturan dinas ini mewajibkan verifikasi wajah untuk kehadiran
              hadir, tetapi status terlambat dan izin tetap bisa dikirim.
            </p>
          ) : requiresWithinArea &&
            attendanceWithinArea === false &&
            selectedStatus !== AttendanceStatus.EXCUSED ? (
            <p className="text-sm text-destructive">
              Lokasi saat ini berada di luar area dinas.
            </p>
          ) : null}

          <DialogFooter>
            <Button
              disabled={
                !selectedStatus ||
                isSubmitting ||
                (selectedStatus !== AttendanceStatus.EXCUSED &&
                  requiresWithinArea &&
                  attendanceWithinArea === false)
              }
              onClick={() => {
                if (!selectedStatus) {
                  return;
                }

                void handleSubmitAttendance(selectedStatus, notes);
              }}
              type="button"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Mengirim...
                </>
              ) : (
                "Kirim"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FaceRecognitionScanner
        open={isFaceScannerOpen}
        onOpenChange={setIsFaceScannerOpen}
        setFaceDescriptor={handleFaceDescriptorCaptured}
      />
    </Card>
  );
}
