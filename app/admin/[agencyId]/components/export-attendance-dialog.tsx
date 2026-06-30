"use client";

import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { toast } from "sonner";
import { CalendarDays, Download, Users } from "lucide-react";
import type { DateRange } from "react-day-picker";
import * as XLSX from "xlsx";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  getAttendances,
  getAttendancesForIntern,
} from "@/lib/services/attendances";
import { getSchedules } from "@/lib/services/schedules";
import type { ExportAttendanceDialogProps } from "@/interfaces/admin";
import type { Attendance } from "@/interfaces/models";
import { getAttendanceStatusLabel } from "@/interfaces/enums";
import { cn } from "@/lib/utils";

/**
 * Component for exporting user attendance records to Excel.
 *
 * @param {ExportAttendanceDialogProps} props - Component properties.
 * @returns {React.JSX.Element} The rendered export dialog.
 */
export default function ExportAttendanceDialog({
  open,
  onOpenChange,
  users,
  shifts,
  assignments,
  interns,
}: ExportAttendanceDialogProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const today = new Date();
    return {
      from: new Date(today.getFullYear(), today.getMonth(), 1),
      to: new Date(today.getFullYear(), today.getMonth() + 1, 0),
    };
  });

  const [exportTarget, setExportTarget] = useState<"all" | "specific">("all");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedInternId, setSelectedInternId] = useState<string>("");
  const [isExporting, setIsExporting] = useState(false);

  // Formatting date range label display helper
  const dateRangeText = useMemo(() => {
    if (dateRange?.from) {
      if (dateRange.to) {
        return `${format(dateRange.from, "dd MMMM yyyy", { locale: id })} - ${format(
          dateRange.to,
          "dd MMMM yyyy",
          { locale: id },
        )}`;
      }
      return format(dateRange.from, "dd MMMM yyyy", { locale: id });
    }
    return "Pilih rentang tanggal";
  }, [dateRange]);

  // Ensure selectedUserId and selectedInternId have defaults when list of users is populated
  useEffect(() => {
    if (open && users.length > 0) {
      const timer = setTimeout(() => {
        if (!selectedUserId) {
          setSelectedUserId(users[0].id);
        }
        // Map selectedUserId to the first intern of that user
        if (selectedUserId) {
          const userInterns = interns.filter(
            (i) => i.userId === selectedUserId,
          );
          if (userInterns.length > 0) {
            setSelectedInternId((prev) => prev || userInterns[0].id);
          }
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [open, users, selectedUserId, interns, selectedInternId]);

  /**
   * Handles the export process to fetch, filter, format and trigger XLSX download.
   */
  const handleExport = async () => {
    if (!dateRange?.from) {
      toast.error("Silakan tentukan rentang tanggal ekspor terlebih dahulu.");
      return;
    }

    setIsExporting(true);
    try {
      let data: Attendance[] = [];
      const fetchLimit = 100000; // Fetch all records within a very high limit to ensure completeness

      // 1. Compute date range strings for API filtering
      const startDateStr = format(dateRange.from, "yyyy-MM-dd");
      const endDateStr = dateRange.to
        ? format(dateRange.to, "yyyy-MM-dd")
        : startDateStr;

      // 2. Fetch attendance records with date range filtering
      if (exportTarget === "all") {
        data = await getAttendances(fetchLimit, startDateStr, endDateStr);
      } else {
        if (!selectedInternId) {
          toast.error("Silakan pilih mahasiswa intern terlebih dahulu.");
          setIsExporting(false);
          return;
        }
        data = await getAttendancesForIntern(
          selectedInternId,
          fetchLimit,
          startDateStr,
          endDateStr,
        );
      }

      // 2. Fetch latest schedules
      const schedules = await getSchedules();

      // 3. Generate date strings in the selected range
      const start = new Date(dateRange.from);
      const end = dateRange.to ? new Date(dateRange.to) : new Date(start);

      const dateStrings: string[] = [];
      const currentIter = new Date(start);
      while (currentIter <= end) {
        dateStrings.push(format(currentIter, "yyyy-MM-dd"));
        currentIter.setDate(currentIter.getDate() + 1);
      }

      // 4. Select target users
      const targetUsers =
        exportTarget === "all"
          ? users
          : users.filter((u) => {
              // For specific export, match by internId mapped to user
              const intern = interns.find((i) => i.id === selectedInternId);
              return intern && intern.userId === u.id;
            });
      const todayStr = format(new Date(), "yyyy-MM-dd");

      const dataToExport = [];

      // 5. Build export data, resolving schedules and absent statuses daily
      for (const user of targetUsers) {
        for (const dateStr of dateStrings) {
          const calendarDay = new Date(dateStr);
          const dayValue = calendarDay.getDay();

          // Get active shift assignments for user on this date
          const userInternIds = interns
            .filter((i) => i.userId === user.id)
            .map((i) => i.id);
          const activeAssigns = assignments.filter((a) => {
            if (!userInternIds.includes(a.internId)) return false;
            return (
              a.startDate <= dateStr && (!a.endDate || a.endDate >= dateStr)
            );
          });

          // Normal schedules scheduled for these shifts on this day of week
          const normalSchedules = activeAssigns.flatMap((assign) =>
            schedules.filter(
              (s) => s.shiftId === assign.shiftId && s.dayOfWeek === dayValue,
            ),
          );

          // Find attendances in fetched database list for this user and date
          const userDateAttendances = data.filter(
            (att) =>
              userInternIds.includes(att.internId) && att.date === dateStr,
          );

          // Merge schedules just like calendar view to account for overrides
          const daySchedules = [...normalSchedules];
          for (const att of userDateAttendances) {
            if (att.schedule) {
              const alreadyExists = daySchedules.some(
                (s) => s.id === att.scheduleId,
              );
              if (!alreadyExists) {
                daySchedules.push(att.schedule);
              }
            }
          }

          if (daySchedules.length > 0) {
            for (const schedule of daySchedules) {
              const attRecord = userDateAttendances.find(
                (a) => a.scheduleId === schedule.id,
              );

              let shiftName =
                shifts.find((s) => s.id === schedule.shiftId)?.name || "";
              if (!shiftName && activeAssigns.length > 0) {
                shiftName =
                  shifts.find((s) => s.id === activeAssigns[0].shiftId)?.name ||
                  "";
              }

              if (attRecord) {
                const status = getAttendanceStatusLabel(attRecord.status);
                let punchTime = "";
                if (attRecord.attendanceTime) {
                  if (
                    attRecord.attendanceTime.includes("T") ||
                    attRecord.attendanceTime.includes("-")
                  ) {
                    try {
                      punchTime = format(
                        new Date(attRecord.attendanceTime),
                        "HH:mm:ss",
                      );
                    } catch {
                      punchTime = attRecord.attendanceTime;
                    }
                  } else {
                    punchTime = attRecord.attendanceTime;
                  }
                }

                const lat =
                  attRecord.attendanceLatitude !== null &&
                  attRecord.attendanceLatitude !== undefined
                    ? attRecord.attendanceLatitude
                    : "";
                const lng =
                  attRecord.attendanceLongitude !== null &&
                  attRecord.attendanceLongitude !== undefined
                    ? attRecord.attendanceLongitude
                    : "";
                const photoUrl = attRecord.attendancePhotoUrl || "";
                const notes = attRecord.notes || "";

                dataToExport.push({
                  "Nama Mahasiswa Intern": user.name,
                  "Email Mahasiswa Intern": user.email,
                  Shift: shiftName,
                  "Jadwal Kerja": schedule.name,
                  Tanggal: dateStr,
                  "Jam Absen": punchTime,
                  Status: status,
                  Latitude: lat,
                  Longitude: lng,
                  Foto: photoUrl,
                  Catatan: notes,
                });
              } else {
                // No attendance record -> Check if past (Alpa) or today (Belum Absen)
                const isPastDate = dateStr < todayStr;
                if (isPastDate) {
                  dataToExport.push({
                    "Nama Mahasiswa Intern": user.name,
                    "Email Mahasiswa Intern": user.email,
                    Shift: shiftName,
                    "Jadwal Kerja": schedule.name,
                    Tanggal: dateStr,
                    "Jam Absen": "",
                    Status: "Alpa",
                    Latitude: "",
                    Longitude: "",
                    Foto: "",
                    Catatan: "Alpa (Sistem)",
                  });
                } else if (dateStr === todayStr) {
                  dataToExport.push({
                    "Nama Mahasiswa Intern": user.name,
                    "Email Mahasiswa Intern": user.email,
                    Shift: shiftName,
                    "Jadwal Kerja": schedule.name,
                    Tanggal: dateStr,
                    "Jam Absen": "",
                    Status: "Belum Absen",
                    Latitude: "",
                    Longitude: "",
                    Foto: "",
                    Catatan: "",
                  });
                }
              }
            }
          }
        }
      }

      if (dataToExport.length === 0) {
        toast.error(
          "Tidak ada jadwal atau data presensi yang ditemukan untuk rentang tanggal tersebut.",
        );
        setIsExporting(false);
        return;
      }

      // Write excel workbook via xlsx library
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Presensi");

      const fromStr = format(dateRange.from, "yyyy-MM-dd");
      const toStr = dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : fromStr;

      const filenamePrefix =
        exportTarget === "all"
          ? "semua_mahasiswa_intern"
          : users.find((u) => u.id === selectedUserId)?.name || "mahasiswa_intern";
      const sanitizedPrefix = filenamePrefix
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "_");

      XLSX.writeFile(
        workbook,
        `data_presensi_${sanitizedPrefix}_${fromStr}_ke_${toStr}.xlsx`,
      );

      toast.success("Data presensi berhasil diekspor ke Excel");
      onOpenChange(false);
    } catch (err) {
      console.error("Gagal mengekspor data presensi ke Excel:", err);
      toast.error("Terjadi kesalahan saat mengekspor data presensi ke Excel.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90dvh] overflow-y-auto scrollbar-none p-4 sm:p-6">
        <DialogHeader className="space-y-1.5">
          <DialogTitle className="text-lg font-bold tracking-tight text-foreground/90 flex items-center gap-2">
            <Download className="size-5 text-primary" />
            Ekspor Data Presensi
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground font-medium">
            Pilih rentang tanggal dan mahasiswa intern untuk mengunduh laporan presensi
            dalam format Excel (.xlsx).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Calendar Date Range Selector */}
          <div className="space-y-1.5 flex flex-col">
            <Label
              htmlFor="date-range"
              className="text-xs font-semibold text-foreground/80 flex items-center gap-1"
            >
              <CalendarDays className="size-3.5 text-muted-foreground" />
              Rentang Tanggal
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date-range"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal rounded-lg bg-background border-border text-xs h-9",
                    !dateRange && "text-muted-foreground",
                  )}
                >
                  <CalendarDays className="mr-2 size-4 text-muted-foreground" />
                  {dateRangeText}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-0 bg-card border-border rounded-lg"
                align="start"
              >
                <Calendar
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={(range) => setDateRange(range)}
                  numberOfMonths={1}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Target User Selector */}
          <div className="space-y-1.5">
            <Label
              htmlFor="export-target"
              className="text-xs font-semibold text-foreground/80 flex items-center gap-1"
            >
              <Users className="size-3.5 text-muted-foreground" />
              Mahasiswa Intern yang Diekspor
            </Label>
            <Select
              value={exportTarget}
              onValueChange={(val) =>
                setExportTarget(val as "all" | "specific")
              }
            >
              <SelectTrigger
                id="export-target"
                className="w-full rounded-lg bg-background border-border text-xs h-9"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border rounded-lg">
                <SelectItem
                  value="all"
                  className="text-xs cursor-pointer rounded-md"
                >
                  Semua Mahasiswa Intern
                </SelectItem>
                <SelectItem
                  value="specific"
                  className="text-xs cursor-pointer rounded-md"
                >
                  Mahasiswa Intern Tertentu
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Specific User Search Selector */}
          {exportTarget === "specific" && (
            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
              <Label
                htmlFor="select-user"
                className="text-xs font-semibold text-foreground/80"
              >
                Pilih Mahasiswa Intern
              </Label>
              <Select
                value={selectedUserId}
                onValueChange={(val) => {
                  setSelectedUserId(val);
                  // Auto-select first intern for this user
                  const userInterns = interns.filter((i) => i.userId === val);
                  setSelectedInternId(userInterns[0]?.id || "");
                }}
              >
                <SelectTrigger
                  id="select-user"
                  className="w-full rounded-lg bg-background border-border text-xs h-9"
                >
                  <SelectValue placeholder="Pilih Mahasiswa Intern" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border rounded-lg max-h-56">
                  {users.map((user) => (
                    <SelectItem
                      key={user.id}
                      value={user.id}
                      className="text-xs cursor-pointer rounded-md"
                    >
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-end items-stretch sm:items-center pt-4">
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isExporting}
              className="w-full sm:w-auto rounded-lg font-medium text-xs h-9"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleExport}
              loading={isExporting}
              className="w-full sm:w-auto bg-primary hover:bg-primary/95 text-primary-foreground font-semibold rounded-lg text-xs h-9 shadow-sm"
            >
              Ekspor Data
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
