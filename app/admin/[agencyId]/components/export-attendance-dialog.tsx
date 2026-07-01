"use client";

import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { toast } from "sonner";
import { CalendarDays, Download, Users, Building2, ChevronsUpDown, Check } from "lucide-react";
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

  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string>("all");
  const [exportMode, setExportMode] = useState<"none" | "all" | "specific">("none");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [isComboboxOpen, setIsComboboxOpen] = useState(false);

  const filteredUsers = useMemo(() => {
    if (selectedInstitutionId === "all") return users;
    return users.filter(user => {
      return interns.some(i => i.userId === user.id && i.institutionId === selectedInstitutionId);
    });
  }, [users, interns, selectedInstitutionId]);

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
    if (open) {
      // Reset form state when dialog opens
      setSelectedInstitutionId("all");
      setExportMode("none");
      setSelectedUserIds([]);
      setIsComboboxOpen(false);
    }
  }, [open]);

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
      if (exportMode === "none") {
        toast.error("Silakan pilih mahasiswa intern yang diekspor terlebih dahulu.");
        setIsExporting(false);
        return;
      }

      let data: Attendance[] = [];
      const fetchLimit = 100000; // Fetch all records within a very high limit to ensure completeness

      // 1. Compute date range strings for API filtering
      const startDateStr = format(dateRange.from, "yyyy-MM-dd");
      const endDateStr = dateRange.to
        ? format(dateRange.to, "yyyy-MM-dd")
        : startDateStr;

      // 2. Fetch all attendance records in range, local filtering will handle the rest
      data = await getAttendances(fetchLimit, startDateStr, endDateStr);

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
        exportMode === "all" || selectedUserIds.length === 0
          ? filteredUsers
          : users.filter((u) => selectedUserIds.includes(u.id));
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
        exportMode === "all" || selectedUserIds.length === 0
          ? "semua_mahasiswa_intern"
          : selectedUserIds.length === 1
          ? users.find((u) => u.id === selectedUserIds[0])?.name || "mahasiswa_intern"
          : "beberapa_mahasiswa_intern";
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
      <DialogContent className="sm:max-w-[900px] w-[95vw] max-h-[90dvh] flex flex-col overflow-hidden p-0 gap-0 bg-white dark:bg-zinc-950 border-none rounded-[2rem] shadow-2xl">
        
        {/* Main Content - Form */}
        <div className="flex flex-col flex-1 min-h-0 p-8 sm:p-10 overflow-y-auto scrollbar-none bg-white dark:bg-zinc-950">
          {/* Header */}
          <div className="flex items-center gap-6 mb-6">
            {/* Download Icon with Glow Effect */}
            <div className="relative w-16 h-16 flex flex-shrink-0 items-center justify-center">
              {/* Glow background */}
              <div className="absolute inset-[-10px] bg-red-100/60 dark:bg-primary/20 rounded-full blur-md"></div>
              {/* Inner dark red circle */}
              <div className="relative w-14 h-14 rounded-full bg-[#701010] dark:bg-primary shadow-md flex items-center justify-center">
                <Download className="size-6 text-white" strokeWidth={2.5} />
              </div>
            </div>
            
            <div className="space-y-1.5 pr-6">
              <DialogTitle className="text-[20px] font-bold tracking-tight text-gray-900 dark:text-zinc-100">
                Ekspor Data Presensi
              </DialogTitle>
              <DialogDescription className="text-[14px] text-gray-500 dark:text-zinc-400 font-medium leading-relaxed">
                Pilih instansi dan mahasiswa intern yang ingin diekspor ke dalam format Excel (.xlsx).
              </DialogDescription>
            </div>
          </div>

          <div className="space-y-6 flex-1">
            {/* Institution Selector */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#FCEDED] dark:bg-primary/10 flex flex-shrink-0 items-center justify-center mt-2">
                <Building2 className="size-5 text-[#8B1A1A] dark:text-primary" strokeWidth={2} />
              </div>
              <div className="space-y-2 flex-1">
                <Label
                  htmlFor="institution-target"
                  className="text-[14px] font-semibold text-gray-900 dark:text-zinc-200 block"
                >
                  Nama Institusi atau Universitas
                </Label>
                <Select
                  value={selectedInstitutionId}
                  onValueChange={(val) => {
                    setSelectedInstitutionId(val);
                    setSelectedUserIds([]);
                  }}
                >
                  <SelectTrigger
                    id="institution-target"
                    className="w-full rounded-xl bg-white dark:bg-zinc-900 border-[#EAAFAF] dark:border-zinc-800 text-[14px] text-gray-700 dark:text-zinc-300 h-11 px-4 shadow-sm focus:ring-[#8B1A1A]/20"
                  >
                    <SelectValue placeholder="Semua Institusi" />
                  </SelectTrigger>
                  <SelectContent 
                    position="popper"
                    side="bottom"
                    sideOffset={8}
                    avoidCollisions={false}
                    className="bg-white dark:bg-zinc-900 border-red-100 dark:border-zinc-800 rounded-xl max-h-56 w-[var(--radix-select-trigger-width)]"
                  >
                    <SelectItem value="all" className="text-[14px] text-gray-700 dark:text-zinc-300 cursor-pointer rounded-lg py-3">
                      Semua Institusi
                    </SelectItem>
                    {institutions?.map((inst) => (
                      <SelectItem key={inst.id} value={inst.id} className="text-[14px] text-gray-700 dark:text-zinc-300 cursor-pointer rounded-lg py-3">
                        {inst.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Export Mode Selector */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#FCEDED] dark:bg-primary/10 flex flex-shrink-0 items-center justify-center mt-2">
                <Users className="size-5 text-[#8B1A1A] dark:text-primary" strokeWidth={2} />
              </div>
              <div className="space-y-2 flex-1">
                <Label
                  htmlFor="export-mode"
                  className="text-[14px] font-semibold text-gray-900 dark:text-zinc-200 block"
                >
                  Mahasiswa Intern yang Diekspor
                </Label>
                <Select
                  value={exportMode === "none" ? undefined : exportMode}
                  onValueChange={(val: "all" | "specific") => {
                    setExportMode(val);
                    if (val === "all") setSelectedUserIds([]);
                  }}
                >
                  <SelectTrigger
                    id="export-mode"
                    className="w-full rounded-xl bg-white dark:bg-zinc-900 border-[#EAAFAF] dark:border-zinc-800 text-[14px] text-gray-700 dark:text-zinc-300 h-11 px-4 shadow-sm focus:ring-[#8B1A1A]/20"
                  >
                    <SelectValue placeholder="Pilih Opsi Ekspor..." />
                  </SelectTrigger>
                  <SelectContent 
                    position="popper"
                    side="bottom"
                    sideOffset={8}
                    avoidCollisions={false}
                    className="bg-white dark:bg-zinc-900 border-red-100 dark:border-zinc-800 rounded-xl max-h-56 w-[var(--radix-select-trigger-width)]"
                  >
                    <SelectItem value="all" className="text-[14px] text-gray-700 dark:text-zinc-300 cursor-pointer rounded-lg py-3">
                      Pilih Semua Mahasiswa
                    </SelectItem>
                    <SelectItem value="specific" className="text-[14px] text-gray-700 dark:text-zinc-300 cursor-pointer rounded-lg py-3">
                      Pilih Mahasiswa Tertentu
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Intern Combobox Selector */}
            {exportMode === "specific" && (
              <div className="flex items-start gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="w-12 h-12 flex flex-shrink-0" />
                <div className="space-y-2 flex-1">
                  <Label
                    htmlFor="select-user"
                    className="text-[14px] font-semibold text-gray-900 dark:text-zinc-200 block"
                  >
                    Pilih Mahasiswa Intern
                  </Label>
                  <Popover open={isComboboxOpen} onOpenChange={setIsComboboxOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isComboboxOpen}
                        className="w-full justify-between rounded-xl bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 hover:border-[#EAAFAF] dark:hover:border-zinc-700 hover:bg-gray-50/50 dark:hover:bg-zinc-800/50 shadow-sm focus:ring-[#8B1A1A]/20 text-[14px] text-gray-700 dark:text-zinc-300 h-11 px-4 font-normal"
                      >
                        <span className="truncate">
                          {selectedUserIds.length === 0
                            ? "Pilih mahasiswa..."
                            : selectedUserIds.length === 1
                            ? filteredUsers.find((user) => user.id === selectedUserIds[0])?.name || "Pilih mahasiswa..."
                            : `${selectedUserIds.length} Mahasiswa Terpilih`}
                        </span>
                        <ChevronsUpDown className="ml-2 size-4 shrink-0 text-gray-400 dark:text-zinc-500" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent 
                      className="w-[var(--radix-popover-trigger-width)] p-0 bg-white dark:bg-zinc-900 border-red-100 dark:border-zinc-800 rounded-xl shadow-lg" 
                      align="start"
                      side="bottom"
                      sideOffset={8}
                      avoidCollisions={false}
                    >
                      <Command>
                        <CommandInput placeholder="Cari nama mahasiswa..." className="text-[14px] text-gray-700 dark:text-zinc-300 h-11" />
                        <CommandList className="max-h-[220px] overflow-y-auto">
                          <CommandEmpty className="text-[14px] py-6 text-center text-gray-500 dark:text-zinc-400">Tidak ada mahasiswa ditemukan.</CommandEmpty>
                          <CommandGroup>
                            {filteredUsers.map((user) => (
                              <CommandItem
                                key={user.id}
                                value={user.name}
                                onSelect={() => {
                                  setSelectedUserIds((prev) => {
                                    if (prev.includes(user.id)) {
                                      return prev.filter((id) => id !== user.id);
                                    }
                                    return [...prev, user.id];
                                  });
                                }}
                                className="text-[14px] text-gray-700 dark:text-zinc-300 py-3 cursor-pointer"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 size-4 text-[#8B1A1A] dark:text-primary",
                                    selectedUserIds.includes(user.id) ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {user.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  {/* Selected Interns List */}
                  {selectedUserIds.length > 1 && (
                    <div className="mt-5 space-y-3">
                      <p className="text-[14px] font-semibold text-gray-900 dark:text-zinc-200 px-1">
                        Daftar Mahasiswa Intern
                      </p>
                      <div className="max-h-[160px] overflow-y-auto scrollbar-thin pr-1 space-y-2">
                        {selectedUserIds.map((id) => {
                          const user = filteredUsers.find((u) => u.id === id);
                          if (!user) return null;
                          return (
                            <div key={id} className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/50 shadow-sm">
                              <span className="text-[14px] text-gray-700 dark:text-zinc-300 font-semibold truncate pr-4">
                                {user.name}
                              </span>
                              <button
                                type="button"
                                onClick={() => setSelectedUserIds((prev) => prev.filter((uId) => uId !== id))}
                                className="text-gray-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400 transition-colors focus:outline-none"
                                title="Hapus pilihan"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Info Alert Box */}
            <div className="bg-[#FCF9F9] dark:bg-zinc-900/40 rounded-2xl p-4 flex gap-4 items-center border border-gray-100 dark:border-zinc-800/50 mt-6">
              <div className="w-6 h-6 rounded-full bg-[#FCEDED] dark:bg-primary/10 border border-[#EAAFAF] dark:border-primary/20 flex flex-shrink-0 items-center justify-center">
                <span className="text-[#8B1A1A] dark:text-primary font-bold text-xs italic">i</span>
              </div>
              <p className="text-[14px] text-gray-600 dark:text-zinc-400 font-medium leading-relaxed">
                Data yang diekspor akan sesuai dengan filter yang Anda pilih.
              </p>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-3 sm:justify-end items-stretch sm:items-center mt-8 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isExporting}
              className="flex-1 rounded-xl font-semibold text-[#701010] dark:text-primary border-gray-200 dark:border-zinc-800 hover:bg-red-50 dark:hover:bg-primary/10 hover:border-red-200 dark:hover:border-primary/30 hover:text-red-950 dark:hover:text-primary text-[14px] h-[48px] shadow-sm"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleExport}
              loading={isExporting}
              className="flex-1 bg-gradient-to-r from-[#8B1A1A] to-[#601010] dark:from-primary dark:to-primary/80 hover:from-[#731515] hover:to-[#500c0c] dark:hover:from-primary/90 dark:hover:to-primary/70 text-white font-semibold rounded-xl text-[14px] h-[48px] shadow-md flex items-center justify-center gap-2"
            >
              {!isExporting && <Download className="size-5" />}
              Ekspor Data
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
