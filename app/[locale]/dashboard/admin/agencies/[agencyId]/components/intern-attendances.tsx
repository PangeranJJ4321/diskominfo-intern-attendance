"use client";

import { useEffect, useMemo, useState } from "react";
import { format, isSameDay, isSameMonth, isToday, startOfDay } from "date-fns";
import { ChevronLeft, ChevronRight, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import * as XLSX from "xlsx";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { attendanceSchema } from "@/lib/schemas/attendance";
import { agencyScheduleSchema } from "@/lib/schemas/agency-schedule";
import { internSchema } from "@/lib/schemas/intern";
import { userSchema } from "@/lib/schemas/user";

import {
  AttendanceEditorDialog,
  type AttendanceEditorTarget,
} from "./attendance-editor-dialog";
import { InternListCard, type InternListItem } from "./intern-list-card";

type AttendanceStatus = z.infer<typeof attendanceSchema>["status"];
type AttendanceRecord = z.infer<typeof attendanceSchema>;
type AgencyScheduleRecord = z.infer<typeof agencyScheduleSchema>;

type SelectedIntern = InternListItem;

type AttendanceWithSchedule = AttendanceRecord & {
  agencySchedule: {
    id: string;
    name: string;
    agencyScheduleStart: string;
    agencyScheduleEnd: string;
    dayOfWeek: number;
  };
  source: "real" | "synthetic";
};

type AttendanceExportFormat = "csv" | "xlsx";

type AttendanceExportRow = {
  Peserta: string;
  Email: string;
  Periode: string;
  Tanggal: string;
  Hari: string;
  Jadwal: string;
  "Jam Jadwal Mulai": string;
  "Jam Jadwal Selesai": string;
  "Jam Absensi": string;
  Status: string;
  Keterangan: string;
  Latitude: string;
  Longitude: string;
  Sumber: string;
};

type InternAttendancesProps = {
  agencyId: string;
};

const DAY_LABELS = [
  { short: "Min", long: "Minggu" },
  { short: "Sen", long: "Senin" },
  { short: "Sel", long: "Selasa" },
  { short: "Rab", long: "Rabu" },
  { short: "Kam", long: "Kamis" },
  { short: "Jum", long: "Jumat" },
  { short: "Sab", long: "Sabtu" },
];

const STATUS_STYLES: Record<AttendanceStatus, string> = {
  PRESENT: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  LATE: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  EXCUSED: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  ABSENT: "bg-destructive/15 text-destructive dark:text-red-400",
};

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  PRESENT: "Hadir",
  LATE: "Terlambat",
  EXCUSED: "Izin",
  ABSENT: "Alpa",
};

function formatMonthLabel(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatScheduleTime(value: string): string {
  return value.length >= 5 ? value.slice(0, 5) : value;
}

function formatExportDate(value: Date): string {
  return format(value, "dd/MM/yyyy");
}

function formatExportTime(value: Date | null): string {
  return value ? format(value, "HH:mm") : "-";
}

function formatDateOnly(value: Date): string {
  return format(value, "yyyy-MM-dd");
}

function createDateRange(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = [];
  const current = startOfDay(new Date(startDate));
  const last = startOfDay(new Date(endDate));

  while (current <= last) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

function getDayLabel(dayIndex: number): string {
  return DAY_LABELS[dayIndex]?.long ?? "";
}

function escapeCsvValue(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

function downloadBlob(blob: Blob, fileName: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.rel = "noreferrer";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}

function buildAttendanceRecords(
  attendances: AttendanceRecord[],
  schedules: AgencyScheduleRecord[],
  selectedIntern: SelectedIntern,
  dateRangeStart: Date,
  dateRangeEnd: Date,
): AttendanceWithSchedule[] {
  const scheduleMap = schedules.reduce<Record<string, AgencyScheduleRecord>>(
    (accumulator, schedule) => {
      accumulator[schedule.id] = schedule;
      return accumulator;
    },
    {},
  );

  const recordMap = new Map<string, AttendanceWithSchedule>();

  attendances.forEach((record) => {
    const dateKey = format(new Date(record.date), "yyyy-MM-dd");
    const key = `${dateKey}-${record.agencyScheduleId}`;
    const schedule = scheduleMap[record.agencyScheduleId];

    recordMap.set(key, {
      ...record,
      agencySchedule: {
        id: record.agencyScheduleId,
        name: schedule?.name ?? "Jadwal",
        agencyScheduleStart: schedule?.agencyScheduleStart ?? "00:00:00",
        agencyScheduleEnd: schedule?.agencyScheduleEnd ?? "00:00:00",
        dayOfWeek: schedule?.dayOfWeek ?? new Date(record.date).getDay(),
      },
      source: "real",
    });
  });

  const allRecords = Array.from(recordMap.values());
  const today = startOfDay(new Date());
  const internStartDate = startOfDay(new Date(selectedIntern.startedAt));
  const internEndDate = startOfDay(selectedIntern.finishedAt ?? dateRangeEnd);
  const periodEndDate =
    internEndDate.getTime() > today.getTime() ? today : internEndDate;

  createDateRange(dateRangeStart, periodEndDate).forEach((day) => {
    const dayStart = startOfDay(day);

    if (dayStart.getTime() > today.getTime()) {
      return;
    }

    if (dayStart.getTime() < internStartDate.getTime()) {
      return;
    }

    if (dayStart.getTime() > periodEndDate.getTime()) {
      return;
    }

    const dateKey = format(dayStart, "yyyy-MM-dd");
    const currentDayOfWeek = dayStart.getDay();

    schedules.forEach((schedule) => {
      if (schedule.dayOfWeek !== currentDayOfWeek) {
        return;
      }

      const key = `${dateKey}-${schedule.id}`;

      if (!recordMap.has(key)) {
        allRecords.push({
          id: `synthetic-${key}`,
          internId: selectedIntern.id,
          agencyScheduleId: schedule.id,
          date: dayStart,
          attendanceTime: null,
          attendanceLatitude: null,
          attendanceLongitude: null,
          attendanceFaceDescriptor: null,
          status: "ABSENT",
          notes: "Tanpa Keterangan",
          createdAt: dayStart,
          updatedAt: dayStart,
          agencySchedule: {
            id: schedule.id,
            name: schedule.name,
            agencyScheduleStart: schedule.agencyScheduleStart,
            agencyScheduleEnd: schedule.agencyScheduleEnd,
            dayOfWeek: schedule.dayOfWeek,
          },
          source: "synthetic",
        });
      }
    });
  });

  return allRecords;
}

function buildAttendanceExportRows(
  records: AttendanceWithSchedule[],
  intern: SelectedIntern,
): AttendanceExportRow[] {
  return records
    .slice()
    .sort((left, right) => {
      const leftDate = left.date.getTime() - right.date.getTime();

      if (leftDate !== 0) {
        return leftDate;
      }

      const scheduleOrder =
        left.agencySchedule.agencyScheduleStart.localeCompare(
          right.agencySchedule.agencyScheduleStart,
        );

      if (scheduleOrder !== 0) {
        return scheduleOrder;
      }

      return left.createdAt.getTime() - right.createdAt.getTime();
    })
    .map((record) => ({
      Peserta: intern.name,
      Email: intern.email,
      Periode: formatInternLabel(intern),
      Tanggal: formatExportDate(record.date),
      Hari: getDayLabel(record.date.getDay()),
      Jadwal: record.agencySchedule.name,
      "Jam Jadwal Mulai": formatScheduleTime(
        record.agencySchedule.agencyScheduleStart,
      ),
      "Jam Jadwal Selesai": formatScheduleTime(
        record.agencySchedule.agencyScheduleEnd,
      ),
      "Jam Absensi": formatExportTime(record.attendanceTime),
      Status: STATUS_LABELS[record.status],
      Keterangan: record.notes ?? "-",
      Latitude:
        record.attendanceLatitude !== null
          ? String(record.attendanceLatitude)
          : "-",
      Longitude:
        record.attendanceLongitude !== null
          ? String(record.attendanceLongitude)
          : "-",
      Sumber: record.source === "real" ? "Real" : "Synthetic",
    }));
}

async function fetchAgencySchedules(
  agencyId: string,
): Promise<AgencyScheduleRecord[]> {
  return fetchAllPages(
    `/api/agency-schedules?agencyId=${agencyId}`,
    (value) => {
      const parsed = agencyScheduleSchema.safeParse(value);
      return parsed.success ? parsed.data : null;
    },
  );
}

async function fetchAttendancesForIntern(
  internId: string,
  startDate: string,
  endDate: string,
): Promise<AttendanceRecord[]> {
  return fetchAllPages(
    `/api/attendances?internId=${internId}&startDate=${startDate}&endDate=${endDate}`,
    (value) => {
      const parsed = attendanceSchema.safeParse(value);
      return parsed.success ? parsed.data : null;
    },
  );
}

async function fetchAttendanceBundle(
  agencyId: string,
  internId: string,
  startDate: string,
  endDate: string,
): Promise<{
  attendances: AttendanceRecord[];
  schedules: AgencyScheduleRecord[];
}> {
  const [attendanceData, scheduleData] = await Promise.all([
    fetchAttendancesForIntern(internId, startDate, endDate),
    fetchAgencySchedules(agencyId),
  ]);

  return {
    attendances: attendanceData,
    schedules: scheduleData,
  };
}

async function exportAttendanceFile(
  formatType: AttendanceExportFormat,
  interns: SelectedIntern[],
  agencyId: string,
): Promise<void> {
  const today = startOfDay(new Date());
  if (interns.length === 0) {
    throw new Error("Tidak ada peserta magang aktif untuk diekspor");
  }

  const schedules = await fetchAgencySchedules(agencyId);
  const rowGroups = await Promise.all(
    interns.map(async (intern) => {
      const exportStartDate = startOfDay(new Date(intern.startedAt));
      const exportEndDate = startOfDay(intern.finishedAt ?? new Date());
      const effectiveEndDate =
        exportEndDate.getTime() > today.getTime() ? today : exportEndDate;

      if (effectiveEndDate.getTime() < exportStartDate.getTime()) {
        return [] as AttendanceExportRow[];
      }

      const attendances = await fetchAttendancesForIntern(
        intern.id,
        formatDateOnly(exportStartDate),
        formatDateOnly(effectiveEndDate),
      );

      const records = buildAttendanceRecords(
        attendances,
        schedules,
        intern,
        exportStartDate,
        effectiveEndDate,
      );

      return buildAttendanceExportRows(records, intern);
    }),
  );

  const rows = rowGroups.flat();
  const fileBaseName = `absensi-intern-aktif-${format(today, "yyyyMMdd")}`;

  if (formatType === "csv") {
    const headers = Object.keys(rows[0] ?? {}) as (keyof AttendanceExportRow)[];
    const csvLines = [
      headers.join(","),
      ...rows.map((row) =>
        headers.map((header) => escapeCsvValue(row[header])).join(","),
      ),
    ];

    downloadBlob(
      new Blob([`\ufeff${csvLines.join("\n")}`], {
        type: "text/csv;charset=utf-8;",
      }),
      `${fileBaseName}.csv`,
    );
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Absensi");
  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  downloadBlob(
    new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    `${fileBaseName}.xlsx`,
  );
}

function getErrorMessage(
  fallback: string,
  responseBody: { error?: string } | null,
): string {
  return responseBody?.error ?? fallback;
}

function formatInternLabel(intern: SelectedIntern): string {
  const formatter = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const startLabel = formatter.format(intern.startedAt);
  const endLabel = intern.finishedAt
    ? formatter.format(intern.finishedAt)
    : "Sekarang";

  return `${startLabel} - ${endLabel}`;
}

async function fetchAllPages<T>(
  baseUrl: string,
  parseItem: (value: unknown) => T | null,
): Promise<T[]> {
  const pageSize = 100;
  const firstResponse = await fetch(`${baseUrl}&page=1&limit=${pageSize}`);

  if (!firstResponse.ok) {
    const payload = (await firstResponse.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new Error(payload.error ?? "Gagal memuat data");
  }

  const firstPayload = (await firstResponse.json()) as {
    data?: unknown[];
    meta?: { totalPages?: number };
  };
  const firstPageItems = Array.isArray(firstPayload.data)
    ? firstPayload.data
        .map(parseItem)
        .filter((item): item is T => item !== null)
    : [];
  const totalPages = firstPayload.meta?.totalPages ?? 1;

  if (totalPages <= 1) {
    return firstPageItems;
  }

  const pageResults = await Promise.all(
    Array.from({ length: totalPages - 1 }, async (_, index) => {
      const page = index + 2;
      const response = await fetch(`${baseUrl}&page=${page}&limit=${pageSize}`);

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(payload.error ?? "Gagal memuat data");
      }

      const payload = (await response.json()) as { data?: unknown[] };
      return Array.isArray(payload.data)
        ? payload.data.map(parseItem).filter((item): item is T => item !== null)
        : [];
    }),
  );

  return firstPageItems.concat(...pageResults);
}

/**
 * Renders the intern attendance management surface for admin and superadmin users.
 */
export function InternAttendances({
  agencyId,
}: InternAttendancesProps): React.JSX.Element {
  const [currentMonth, setCurrentMonth] = useState<Date>(() => new Date());
  const [searchValue, setSearchValue] = useState<string>("");
  const [interns, setInterns] = useState<SelectedIntern[]>([]);
  const [rawAttendances, setRawAttendances] = useState<AttendanceRecord[]>([]);
  const [schedules, setSchedules] = useState<AgencyScheduleRecord[]>([]);
  const [selectedInternId, setSelectedInternId] = useState<string | null>(null);
  const [selectedAttendance, setSelectedAttendance] =
    useState<AttendanceEditorTarget | null>(null);
  const [isLoadingInterns, setIsLoadingInterns] = useState<boolean>(false);
  const [isLoadingAttendance, setIsLoadingAttendance] =
    useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);

  const activeInternsForExport = useMemo(() => {
    const today = startOfDay(new Date());

    return interns.filter((intern) => {
      const startedAt = startOfDay(new Date(intern.startedAt));
      const finishedAt = intern.finishedAt
        ? startOfDay(new Date(intern.finishedAt))
        : null;

      return (
        startedAt.getTime() <= today.getTime() &&
        (!finishedAt || finishedAt.getTime() >= today.getTime())
      );
    });
  }, [interns]);

  const effectiveSelectedInternId = useMemo(() => {
    if (interns.length === 0) {
      return null;
    }

    return interns.some((intern) => intern.id === selectedInternId)
      ? selectedInternId
      : interns[0].id;
  }, [interns, selectedInternId]);

  const selectedIntern = useMemo(
    () =>
      interns.find((intern) => intern.id === effectiveSelectedInternId) ?? null,
    [effectiveSelectedInternId, interns],
  );

  const activeSelectedAttendance = useMemo(() => {
    if (!selectedAttendance || !selectedIntern) {
      return null;
    }

    return selectedAttendance.internId === selectedIntern.id
      ? selectedAttendance
      : null;
  }, [selectedAttendance, selectedIntern]);

  const startDate = useMemo(() => {
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1,
    );
    date.setDate(date.getDate() - date.getDay());
    return date;
  }, [currentMonth]);

  const endDate = useMemo(() => {
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0,
    );
    date.setDate(date.getDate() + (6 - date.getDay()));
    return date;
  }, [currentMonth]);

  const startDateKey = formatDateOnly(startDate);
  const endDateKey = formatDateOnly(endDate);

  const calendarDays = useMemo(() => {
    const days: Date[] = [];
    const day = new Date(startDateKey);
    const end = new Date(endDateKey);

    while (day <= end) {
      days.push(new Date(day));
      day.setDate(day.getDate() + 1);
    }

    return days;
  }, [startDateKey, endDateKey]);

  const filteredInterns = useMemo(() => {
    const query = searchValue.trim().toLowerCase();

    if (!query) {
      return interns;
    }

    return interns.filter(
      (intern) =>
        intern.name.toLowerCase().includes(query) ||
        intern.email.toLowerCase().includes(query),
    );
  }, [interns, searchValue]);

  const attendanceRecords = useMemo<AttendanceWithSchedule[]>(() => {
    if (!selectedIntern) {
      return [];
    }

    return buildAttendanceRecords(
      rawAttendances,
      schedules,
      selectedIntern,
      startDate,
      endDate,
    );
  }, [endDate, rawAttendances, schedules, selectedIntern, startDate]);

  useEffect(() => {
    let isActive = true;

    async function loadInterns(): Promise<void> {
      setIsLoadingInterns(true);
      setLoadError(null);

      try {
        const [parsedInterns, parsedUsersPayload] = await Promise.all([
          fetchAllPages(
            "/api/interns?sortBy=createdAt&sortOrder=desc",
            (value) => {
              const parsed = internSchema.safeParse(value);
              return parsed.success ? parsed.data : null;
            },
          ),
          fetchAllPages(
            "/api/users?role=INTERN&sortBy=createdAt&sortOrder=desc",
            (value) => {
              const parsed = userSchema.safeParse(value);
              return parsed.success ? parsed.data : null;
            },
          ),
        ]);

        if (!isActive) {
          return;
        }

        const internUsers = parsedUsersPayload.filter(
          (user) => user.role === "INTERN",
        );

        const userMap = new Map(internUsers.map((user) => [user.id, user]));

        const nextInterns = parsedInterns
          .filter((intern) => intern.agencyId === agencyId)
          .map((intern) => {
            const user = userMap.get(intern.userId);

            if (!user) {
              return null;
            }

            return {
              id: intern.id,
              userId: intern.userId,
              agencyId: intern.agencyId,
              name: user.name,
              email: user.email,
              startedAt: intern.startedAt,
              finishedAt: intern.finishedAt,
            } satisfies SelectedIntern;
          })
          .filter((intern): intern is SelectedIntern => intern !== null)
          .sort((left, right) => left.name.localeCompare(right.name));

        setInterns(nextInterns);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setLoadError(
          error instanceof Error
            ? error.message
            : "Gagal memuat daftar peserta magang",
        );
        setInterns([]);
      } finally {
        if (isActive) {
          setIsLoadingInterns(false);
        }
      }
    }

    void loadInterns();

    return () => {
      isActive = false;
    };
  }, [agencyId]);

  useEffect(() => {
    const activeIntern = selectedIntern;

    if (!activeIntern) {
      return;
    }

    const internId = activeIntern.id;

    let isActive = true;

    async function loadAttendance(): Promise<void> {
      setIsLoadingAttendance(true);
      setAttendanceError(null);

      try {
        const { attendances, schedules: nextSchedules } =
          await fetchAttendanceBundle(
            agencyId,
            internId,
            startDateKey,
            endDateKey,
          );

        if (!isActive) {
          return;
        }

        setRawAttendances(attendances);
        setSchedules(nextSchedules);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        const message =
          error instanceof Error ? error.message : "Gagal memuat data absensi";
        setAttendanceError(message);
        setRawAttendances([]);
        setSchedules([]);
      } finally {
        if (isActive) {
          setIsLoadingAttendance(false);
        }
      }
    }

    void loadAttendance();

    return () => {
      isActive = false;
    };
  }, [agencyId, selectedIntern, startDateKey, endDateKey]);

  const nextMonth = (): void => {
    setCurrentMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() + 1, 1),
    );
  };

  const prevMonth = (): void => {
    setCurrentMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() - 1, 1),
    );
  };

  const goToToday = (): void => {
    setCurrentMonth(new Date());
  };

  const handleSelectAttendance = (attendance: AttendanceWithSchedule): void => {
    setSelectedAttendance(attendance);
  };

  const handleSelectIntern = (internId: string): void => {
    setSelectedInternId(internId);
    setSelectedAttendance(null);
  };

  const handleCloseEditor = (open: boolean): void => {
    if (!open) {
      setSelectedAttendance(null);
    }
  };

  const handleExportAttendance = async (
    formatType: AttendanceExportFormat,
  ): Promise<void> => {
    if (activeInternsForExport.length === 0) {
      toast.error("Tidak ada peserta magang untuk diekspor");
      return;
    }

    setIsExporting(true);

    try {
      await exportAttendanceFile(formatType, activeInternsForExport, agencyId);
      toast.success("Absensi semua peserta aktif berhasil diekspor");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal mengekspor absensi";
      toast.error(message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveAttendance = async (values: {
    status: AttendanceStatus;
    notes: string;
  }): Promise<void> => {
    if (!selectedIntern || !activeSelectedAttendance) {
      return;
    }

    const normalizedNotes = values.notes.trim();
    const previousAttendances = rawAttendances;
    const nextNotes = normalizedNotes.length > 0 ? normalizedNotes : null;
    const isExistingRecord =
      activeSelectedAttendance.source === "real" &&
      Boolean(activeSelectedAttendance.id);
    const attendanceDate = formatDateOnly(activeSelectedAttendance.date);
    const optimisticRecord: AttendanceRecord = {
      id: isExistingRecord ? activeSelectedAttendance.id : `temp-${Date.now()}`,
      internId: activeSelectedAttendance.internId,
      agencyScheduleId: activeSelectedAttendance.agencyScheduleId,
      date: activeSelectedAttendance.date,
      attendanceTime: activeSelectedAttendance.attendanceTime,
      attendanceLatitude: activeSelectedAttendance.attendanceLatitude,
      attendanceLongitude: activeSelectedAttendance.attendanceLongitude,
      attendanceFaceDescriptor:
        activeSelectedAttendance.attendanceFaceDescriptor,
      status: values.status,
      notes: nextNotes,
      createdAt: activeSelectedAttendance.createdAt,
      updatedAt: new Date(),
    };

    setRawAttendances((current) => {
      if (isExistingRecord) {
        return current.map((record) =>
          record.id === selectedAttendance?.id ? optimisticRecord : record,
        );
      }

      return [...current, optimisticRecord];
    });

    setIsSaving(true);

    try {
      const response = await fetch(
        isExistingRecord
          ? `/api/attendances/${activeSelectedAttendance.id}`
          : "/api/attendances",
        {
          method: isExistingRecord ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            isExistingRecord
              ? {
                  status: values.status,
                  notes: nextNotes,
                }
              : {
                  internId: selectedIntern.id,
                  agencyScheduleId: activeSelectedAttendance.agencyScheduleId,
                  date: attendanceDate,
                  status: values.status,
                  notes: nextNotes,
                },
          ),
        },
      );

      const responseBody = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        throw new Error(
          getErrorMessage("Gagal menyimpan absensi", responseBody),
        );
      }

      const savedAttendance = attendanceSchema.parse(responseBody);

      setRawAttendances((current) => {
        if (isExistingRecord) {
          return current.map((record) =>
            record.id === activeSelectedAttendance.id
              ? savedAttendance
              : record,
          );
        }

        return current
          .filter((record) => record.id !== optimisticRecord.id)
          .concat(savedAttendance);
      });

      setSelectedAttendance(null);
      toast.success("Absensi berhasil disimpan");
    } catch (error) {
      setRawAttendances(previousAttendances);

      const message =
        error instanceof Error ? error.message : "Gagal menyimpan absensi";
      toast.error(message);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="w-full p-3">
      <CardHeader className="flex flex-col items-start justify-between gap-4 py-3 sm:flex-row sm:items-center">
        <div className="space-y-1">
          <CardTitle className="text-xl">
            Pengelolaan Kehadiran Peserta Magang
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Pilih peserta magang, lihat riwayat absensi, lalu buka detail untuk
            mengubah status secara manual.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                type="button"
                disabled={isExporting || activeInternsForExport.length === 0}
              >
                {isExporting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Download className="size-4" />
                )}
                <span className="hidden sm:inline">Ekspor Semua</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => void handleExportAttendance("csv")}
                disabled={isExporting || activeInternsForExport.length === 0}
                className="cursor-pointer"
              >
                CSV semua peserta aktif
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => void handleExportAttendance("xlsx")}
                disabled={isExporting || activeInternsForExport.length === 0}
                className="cursor-pointer"
              >
                Excel (.xlsx) semua peserta aktif
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="hidden sm:inline-flex"
            type="button"
          >
            Bulan Ini
          </Button>
          <div className="flex items-center gap-1 rounded-md border bg-background p-1 shadow-sm">
            <Button
              variant="ghost"
              size="icon"
              onClick={prevMonth}
              className="size-7"
              type="button"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <div className="w-36 text-center text-sm font-semibold">
              {formatMonthLabel(currentMonth)}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={nextMonth}
              className="size-7"
              type="button"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <InternListCard
            interns={filteredInterns}
            selectedInternId={effectiveSelectedInternId}
            searchValue={searchValue}
            onSearchValueChange={setSearchValue}
            onSelectIntern={handleSelectIntern}
            isLoading={isLoadingInterns}
            error={loadError}
          />

          <Card className="h-full">
            <CardContent className="space-y-4 p-0">
              <div className="border-b px-6 py-4">
                {selectedIntern ? (
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      Peserta aktif
                    </p>
                    <h3 className="text-lg font-semibold">
                      {selectedIntern.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedIntern.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatInternLabel(selectedIntern)}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      Pilih peserta magang untuk melihat kalender kehadiran.
                    </p>
                  </div>
                )}
              </div>

              <div className="px-6 pb-6">
                <div className="mb-4 flex items-center justify-between gap-3 text-sm text-muted-foreground">
                  {isLoadingAttendance ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" /> Memuat
                      catatan...
                    </span>
                  ) : attendanceError ? (
                    <span className="text-destructive">{attendanceError}</span>
                  ) : null}
                </div>

                {selectedIntern ? (
                  <>
                    <div className="overflow-hidden rounded-xl border">
                      <div className="grid grid-cols-7 border-b bg-muted/30 text-center text-sm font-medium text-muted-foreground">
                        {DAY_LABELS.map((dayLabel) => (
                          <div
                            key={dayLabel.short}
                            className="py-3 text-xs uppercase tracking-wider"
                          >
                            <span className="hidden sm:inline">
                              {dayLabel.long}
                            </span>
                            <span className="sm:hidden">{dayLabel.short}</span>
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-7 gap-px bg-border">
                        {calendarDays.map((calendarDay, index) => {
                          const dayRecords = attendanceRecords
                            .filter((record) =>
                              isSameDay(record.date, calendarDay),
                            )
                            .sort((firstRecord, secondRecord) => {
                              const firstStart =
                                firstRecord.agencySchedule.agencyScheduleStart;
                              const secondStart =
                                secondRecord.agencySchedule.agencyScheduleStart;

                              return (
                                firstStart.localeCompare(secondStart) ||
                                firstRecord.createdAt.getTime() -
                                  secondRecord.createdAt.getTime()
                              );
                            });

                          const isCurrentMonth = isSameMonth(
                            calendarDay,
                            currentMonth,
                          );
                          const isTodayDate = isToday(calendarDay);

                          return (
                            <div
                              key={`${calendarDay.toISOString()}-${index}`}
                              className={`relative flex min-h-28 flex-col gap-1 bg-background p-1.5 transition-colors hover:bg-muted/30 sm:p-2 ${
                                !isCurrentMonth
                                  ? "bg-muted/10 text-muted-foreground/50"
                                  : ""
                              }`}
                            >
                              <div className="mb-1 flex justify-end">
                                <span
                                  className={`flex size-6 items-center justify-center rounded-full text-xs font-medium sm:size-7 sm:text-sm ${
                                    isTodayDate
                                      ? "bg-primary text-primary-foreground"
                                      : ""
                                  }`}
                                >
                                  {format(calendarDay, "d")}
                                </span>
                              </div>

                              <div className="flex flex-col gap-1 overflow-y-auto">
                                {dayRecords.map((record) => {
                                  const statusStyle =
                                    STATUS_STYLES[record.status];
                                  const statusLabel =
                                    STATUS_LABELS[record.status];
                                  const timeLabel = record.attendanceTime
                                    ? format(record.attendanceTime, "HH:mm")
                                    : formatScheduleTime(
                                        record.agencySchedule
                                          .agencyScheduleStart,
                                      );

                                  return (
                                    <button
                                      key={record.id}
                                      type="button"
                                      onClick={() =>
                                        handleSelectAttendance(record)
                                      }
                                      className={`flex flex-col rounded-md px-1.5 py-1 text-left text-[10px] font-medium transition-transform hover:scale-[1.01] sm:text-xs ${statusStyle}`}
                                    >
                                      <div className="flex items-center justify-between font-bold">
                                        <span className="truncate pr-2">
                                          {record.agencySchedule.name}
                                        </span>
                                        <span>{timeLabel}</span>
                                      </div>
                                      <span className="opacity-90">
                                        {statusLabel}
                                        {record.notes
                                          ? ` • ${record.notes}`
                                          : ""}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-4 text-xs font-medium text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <div className="size-3 rounded-sm bg-emerald-500/20" />
                        Hadir
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="size-3 rounded-sm bg-amber-500/20" />
                        Terlambat
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="size-3 rounded-sm bg-blue-500/20" />
                        Izin
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="size-3 rounded-sm bg-destructive/20" />
                        Alpa
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-sm text-muted-foreground">
                    Tidak ada peserta yang dapat ditampilkan.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>

      <AttendanceEditorDialog
        open={activeSelectedAttendance !== null}
        attendance={activeSelectedAttendance}
        intern={selectedIntern}
        isSaving={isSaving}
        onOpenChange={handleCloseEditor}
        onSave={handleSaveAttendance}
      />
    </Card>
  );
}
