"use client";

import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { toast } from "sonner";
import { CalendarDays, Download, Users, Check, ChevronsUpDown, X, Building2 } from "lucide-react";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
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
  institutions,
}: ExportAttendanceDialogProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const today = new Date();
    return {
      from: new Date(today.getFullYear(), today.getMonth(), 1),
      to: new Date(today.getFullYear(), today.getMonth() + 1, 0),
    };
  });

  const [exportTarget, setExportTarget] = useState<"all" | "specific">("all");
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string>("all");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedInternIds, setSelectedInternIds] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [comboboxOpen, setComboboxOpen] = useState(false);

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
        if (selectedInternIds.length === 0) {
          toast.error("Silakan pilih minimal satu mahasiswa intern terlebih dahulu.");
          setIsExporting(false);
          return;
        }
        const dataPromises = selectedInternIds.map(internId =>
          getAttendancesForIntern(internId, fetchLimit, startDateStr, endDateStr)
        );
        const results = await Promise.all(dataPromises);
        data = results.flat();
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
      let targetUsers = users;
      if (selectedInstitutionId !== "all") {
        targetUsers = targetUsers.filter((u) => {
          const uInterns = interns.filter((i) => i.userId === u.id);
          return uInterns.some((i) => i.institutionId === selectedInstitutionId);
        });
      }
      if (exportTarget === "specific") {
        targetUsers = targetUsers.filter((u) => selectedUserIds.includes(u.id));
      }
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
          : selectedUserIds.length === 1
            ? users.find((u) => u.id === selectedUserIds[0])?.name || "mahasiswa_intern"
            : `mahasiswa_intern_terpilih_${selectedUserIds.length}`;
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
      <DialogContent className="!w-[90vw] !max-w-[90vw] !h-[90vh] flex flex-col overflow-y-auto scrollbar-none p-4 sm:p-6">
        <DialogHeader className="space-y-1.5 shrink-0">
          <DialogTitle className="text-xl font-bold tracking-tight text-foreground/90 flex items-center gap-2">
            <Download className="size-6 text-primary" />
            Ekspor Data Presensi
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground font-medium">
            Pilih rentang tanggal dan mahasiswa intern untuk mengunduh laporan presensi
            dalam format Excel (.xlsx).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2 flex-1">
          {/* Institution Selector */}
          <div className="space-y-1.5 flex flex-col">
            <Label
              htmlFor="institution-select"
              className="text-lg font-semibold text-foreground/80 flex items-center gap-2"
            >
              <div className="flex items-center justify-center size-6 rounded bg-foreground/10">
                <Building2 className="size-3.5 text-foreground/80" />
              </div>
              Institusi
            </Label>
            <Select
              value={selectedInstitutionId}
              onValueChange={(val) => {
                setSelectedInstitutionId(val);
                setExportTarget("all"); // Reset specific user when institution changes
                setSelectedUserIds([]);
                setSelectedInternIds([]);
              }}
            >
              <SelectTrigger
                id="institution-select"
                className="w-full rounded-lg bg-background border-border text-lg h-12"
              >
                <SelectValue placeholder="Semua Institusi" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border rounded-lg max-h-56">
                <SelectItem value="all" className="text-lg cursor-pointer rounded-md py-3">
                  Semua Institusi
                </SelectItem>
                {institutions.map((inst) => (
                  <SelectItem key={inst.id} value={inst.id} className="text-lg cursor-pointer rounded-md py-3">
                    {inst.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Target User Selector */}
          <div className="space-y-1.5">
            <Label
              htmlFor="export-target"
              className="text-lg font-semibold text-foreground/80 flex items-center gap-1.5"
            >
              <Users className="size-5 text-muted-foreground" />
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
                className="w-full rounded-lg bg-background border-border text-lg h-12"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border rounded-lg">
                <SelectItem
                  value="all"
                  className="text-lg cursor-pointer rounded-md py-3"
                >
                  Semua Mahasiswa Intern
                </SelectItem>
                <SelectItem
                  value="specific"
                  className="text-lg cursor-pointer rounded-md py-3"
                >
                  Mahasiswa Intern Tertentu
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Specific User Search Selector */}
          {exportTarget === "specific" && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-200 flex flex-col">
              <Label
                htmlFor="select-user"
                className="text-lg font-semibold text-foreground/80"
              >
                Pilih Mahasiswa Intern
              </Label>
              <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={comboboxOpen}
                    className="w-full justify-between text-left font-normal rounded-lg bg-background border-border text-base h-11"
                  >
                    <span
                      className={cn(
                        "truncate",
                        selectedUserIds.length === 0
                          ? "text-muted-foreground"
                          : "text-foreground font-medium"
                      )}
                    >
                      {selectedUserIds.length > 0
                        ? `${selectedUserIds.length} Mahasiswa Terpilih`
                        : "Cari"}
                    </span>
                    <ChevronsUpDown className="ml-2 size-5 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Cari nama mahasiswa..." className="h-11 text-base" />
                    <CommandList className="max-h-[250px] overflow-y-auto scrollbar-thin">
                      <CommandEmpty className="py-4 text-center text-base text-muted-foreground">
                        Mahasiswa tidak ditemukan.
                      </CommandEmpty>
                      <CommandGroup>
                        {users
                          .filter(
                            (u) =>
                              selectedInstitutionId === "all" ||
                              interns.some(
                                (i) =>
                                  i.userId === u.id &&
                                  i.institutionId === selectedInstitutionId,
                              ),
                          )
                          .map((user) => {
                            const isSelected = selectedUserIds.includes(user.id);
                            return (
                              <CommandItem
                                key={user.id}
                                value={`${user.name} ${user.email}`}
                                onSelect={() => {
                                  if (isSelected) {
                                    setSelectedUserIds((prev) => prev.filter((id) => id !== user.id));
                                    const userInterns = interns.filter((i) => i.userId === user.id);
                                    if (userInterns[0]) {
                                      setSelectedInternIds((prev) => prev.filter((id) => id !== userInterns[0].id));
                                    }
                                  } else {
                                    setSelectedUserIds((prev) => [...prev, user.id]);
                                    const userInterns = interns.filter((i) => i.userId === user.id);
                                    if (userInterns[0]) {
                                      setSelectedInternIds((prev) => [...prev, userInterns[0].id]);
                                    }
                                  }
                                }}
                                className="text-base cursor-pointer py-2.5 font-medium"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 size-4",
                                    isSelected ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {user.name}
                              </CommandItem>
                            );
                          })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {/* Selected Blocks */}
              {selectedUserIds.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-3 max-h-[220px] overflow-y-auto scrollbar-thin pr-1">
                  {selectedUserIds.map((userId) => {
                    const user = users.find((u) => u.id === userId);
                    if (!user) return null;
                    return (
                      <div
                        key={user.id}
                        className="group flex items-center justify-between w-full rounded-md bg-background border border-border text-sm py-1.5 px-2.5 shadow-sm hover:bg-muted/40 transition-colors"
                      >
                        <span className="font-medium text-foreground/90 truncate mr-2">{user.name}</span>
                        <button
                          type="button"
                          className="shrink-0 text-muted-foreground/70 hover:bg-destructive/10 hover:text-destructive rounded p-1 transition-colors focus:outline-none"
                          onClick={() => {
                            setSelectedUserIds((prev) => prev.filter((id) => id !== user.id));
                            const userInterns = interns.filter((i) => i.userId === user.id);
                            if (userInterns[0]) {
                              setSelectedInternIds((prev) => prev.filter((id) => id !== userInterns[0].id));
                            }
                          }}
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-3 sm:justify-end items-stretch sm:items-center pt-4 shrink-0 mt-auto">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isExporting}
              className="w-full sm:w-auto rounded-lg font-medium text-sm h-10 px-6"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleExport}
              loading={isExporting}
              className="w-full sm:w-auto bg-primary hover:bg-primary/95 text-primary-foreground font-semibold rounded-lg text-sm h-10 px-6 shadow-sm"
            >
              Ekspor Data
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
