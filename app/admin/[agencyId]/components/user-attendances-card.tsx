"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { format, isSameMonth } from "date-fns";
import { id } from "date-fns/locale";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  Search,
  UserCog,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import UserAttendances from "@/components/custom/user-attendances";
import UserAttendanceEditDialog from "./user-attendance-edit-dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatWeekRange } from "@/lib/date-utils";
import UserAttendanceCreateDialog from "./user-attendance-create-dialog";
import UserShiftEditDialog from "./user-shift-edit-dialog";
import ExportAttendanceDialog from "./export-attendance-dialog";
import { getInitials } from "@/lib/string-utils";

// Zustand stores — replace direct API calls
import { useUserStore } from "@/stores/useUserStore";
import { useShiftStore } from "@/stores/useShiftStore";
import { useShiftAssignmentStore } from "@/stores/useShiftAssignmentStore";
import { useInternStore } from "@/stores/useInternStore";
import { useAttendanceStore } from "@/stores/useAttendanceStore";

import type { Schedule, Attendance } from "@/interfaces/models";
import { AttendanceStatus } from "@/interfaces/enums";

/**
 * Renders the admin dashboard user attendance management card.
 *
 * Uses Zustand stores for user, shift, assignment, and intern data.
 * No more refreshCounter — dialogs refetch specific stores on success.
 *
 * @returns {React.JSX.Element} The rendered user attendance control card.
 */
export default function UserAttendancesCard() {
  const isMobile = useIsMobile();

  // ── Zustand stores ──
  const users = useUserStore((s) => s.users);
  const fetchUsers = useUserStore((s) => s.fetchUsers);
  const shifts = useShiftStore((s) => s.shifts);
  const fetchShifts = useShiftStore((s) => s.fetchShifts);
  const assignments = useShiftAssignmentStore((s) => s.assignments);
  const fetchAssignments = useShiftAssignmentStore((s) => s.fetchAssignments);
  const interns = useInternStore((s) => s.interns);
  const fetchInterns = useInternStore((s) => s.fetchInterns);
  const attendances = useAttendanceStore((s) => s.attendances);

  const [selectedUser, setSelectedUser] = useState<NonNullable<
    (typeof users)[number]
  > | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Date State for Calendar
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // User Shift Assignment Dialog state
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);

  // Attendance Override Dialog state
  const [isOverrideOpen, setIsOverrideOpen] = useState(false);
  const [overrideDate, setOverrideDate] = useState<Date | null>(null);
  const [overrideSchedule, setOverrideSchedule] = useState<Schedule | null>(
    null,
  );
  const [overrideExisting, setOverrideExisting] = useState<Attendance | null>(
    null,
  );

  // Export Attendance Dialog state
  const [isExportOpen, setIsExportOpen] = useState(false);

  // ── Refresh helper – re-fetches from stores on success actions ──
  const refreshAll = useCallback(async () => {
    await Promise.all([
      fetchUsers(),
      fetchShifts(),
      fetchAssignments(),
      fetchInterns(),
    ]);
  }, [fetchUsers, fetchShifts, fetchAssignments, fetchInterns]);

  /** Called after a shift assignment or attendance mutation succeeds. */
  const handleRefreshSuccess = useCallback(() => {
    void refreshAll().catch((err) => {
      console.error("Gagal refresh data setelah mutasi", err);
    });
  }, [refreshAll]);

  useEffect(() => {
    const timer = setTimeout(() => setIsClient(true), 0);
    let cancelled = false;

    async function loadData() {
      setIsLoading(true);
      try {
        await refreshAll();
        if (!cancelled) {
          const currentUsers = useUserStore.getState().users;
          setSelectedUser((prev) => {
            if (!prev && currentUsers.length > 0) return currentUsers[0];
            if (prev) {
              return currentUsers.find((u) => u.id === prev.id) ?? prev;
            }
            return prev;
          });
        }
      } catch (err) {
        console.error("Gagal memuat data", err);
        toast.error("Gagal memuat data peserta magang");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadData();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [refreshAll]);

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return users;
    return users.filter(
      (u) =>
        (u.name || "").toLowerCase().includes(query) ||
        (u.email || "").toLowerCase().includes(query),
    );
  }, [users, searchQuery]);

  const activeAssignments = useMemo(() => {
    if (!selectedUser) return [];
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const userInternIds = interns
      .filter((i) => i.userId === selectedUser.id)
      .map((i) => i.id);
    return assignments.filter(
      (a) =>
        userInternIds.includes(a.internId) &&
        a.startDate <= todayStr &&
        (!a.endDate || a.endDate >= todayStr),
    );
  }, [selectedUser, assignments, interns]);

  const activeShifts = useMemo(() => {
    if (activeAssignments.length === 0) return [];
    return activeAssignments
      .map((a) => shifts.find((s) => s.id === a.shiftId))
      .filter((s): s is NonNullable<typeof s> => !!s);
  }, [activeAssignments, shifts]);

  // Month navigation helpers
  const userAttendances = useMemo(() => {
    if (!selectedUser) return [];
    const userInternIds = interns
      .filter((i) => i.userId === selectedUser.id)
      .map((i) => i.id);
    return attendances.filter((a) => userInternIds.includes(a.internId));
  }, [selectedUser, interns, attendances]);

  const stats = useMemo(() => {
    let hadir = 0;
    let sakit = 0;
    let izin = 0;
    let terlambat = 0;
    let alpa = 0;

    userAttendances.forEach((a) => {
      // Only count for the currently viewed month
      const isCurrentMonth = isSameMonth(new Date(a.date), currentMonth);
      if (!isCurrentMonth) return;

      if (a.status === AttendanceStatus.PRESENT) {
        hadir++;
      } else if (a.status === AttendanceStatus.LATE) {
        terlambat++;
        hadir++; // Note: Terlambat is still considered "Hadir" for the total count
      } else if (a.status === AttendanceStatus.SICK) {
        sakit++;
      } else if (a.status === AttendanceStatus.EXCUSED) {
        izin++;
      } else if (a.status === AttendanceStatus.ABSENT) {
        alpa++;
      }
    });

    return { hadir, sakit, izin, terlambat, alpa };
  }, [userAttendances, currentMonth]);

  // Month navigation helpers
  const handleNextMonth = () => {
    if (isMobile) {
      const next = new Date(currentMonth);
      next.setDate(currentMonth.getDate() + 7);
      setCurrentMonth(next);
    } else {
      setCurrentMonth(
        new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
      );
    }
  };

  const handlePrevMonth = () => {
    if (isMobile) {
      const prev = new Date(currentMonth);
      prev.setDate(currentMonth.getDate() - 7);
      setCurrentMonth(prev);
    } else {
      setCurrentMonth(
        new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
      );
    }
  };

  const handleGoToToday = () => {
    setCurrentMonth(new Date());
  };

  // Calendar Day Click Handler
  const handleCalendarDayClick = (
    date: Date,
    schedule: Schedule,
    existingAttendance: Attendance | null,
  ) => {
    setOverrideDate(date);
    setOverrideSchedule(schedule);
    setOverrideExisting(existingAttendance);
    setIsOverrideOpen(true);
  };

  if (!isClient || isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column Skeleton */}
        <Card className="lg:col-span-1 flex flex-col p-4 gap-4 h-87.5 lg:h-auto">
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>
          <div className="space-y-3 pt-2 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-2 border border-transparent"
              >
                <Skeleton className="size-8.5 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4.5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Right Column Skeleton */}
        <Card className="lg:col-span-3 p-6 space-y-6 flex flex-col">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <Skeleton className="size-11 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-4.5 w-36" />
                <Skeleton className="h-3 w-28" />
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-24 rounded-lg" />
            </div>
          </div>
          <div className="space-y-4 flex-1">
            <div className="flex justify-between items-center">
              <div className="space-y-1.5">
                <Skeleton className="h-4.5 w-48" />
                <Skeleton className="h-3 w-72" />
              </div>
              <Skeleton className="h-8 w-36 rounded-lg" />
            </div>
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
      {/* Left Sidebar: Employee List */}
      <div className="lg:col-span-1 relative h-87.5 lg:h-auto lg:min-h-0">
        <Card className="flex flex-col overflow-hidden p-4 w-full h-full lg:absolute lg:inset-0 bg-background/50 border-border/40 shadow-none">
          <div className="space-y-3 pb-3 shrink-0">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-foreground">
                Daftar Peserta Magang
              </h3>
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={() => setIsExportOpen(true)}
                  className="h-7 rounded-lg border-border text-xs flex items-center gap-1 font-semibold px-2"
                  title="Ekspor Data Presensi"
                >
                  <Download className="size-3.5" />
                  Ekspor
                </Button>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground/60" />
              <Input
                placeholder="Cari nama atau email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-muted/20 border-border/30 rounded-lg text-xs h-9 focus-visible:ring-1 focus-visible:ring-red-900"
              />
            </div>
          </div>

          {/* Scrollable List */}
          <div className="flex-1 overflow-y-auto pt-3 space-y-1.5 pr-2 -mr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full scrollbar-thin">
            {filteredUsers.length === 0 ? (
              <div className="text-center text-xs text-muted-foreground py-8">
                Tidak ada peserta magang ditemukan
              </div>
            ) : (
              filteredUsers.map((user) => {
                const isSelected = selectedUser?.id === user.id;
                const todayStr = format(new Date(), "yyyy-MM-dd");
                const userInternIds = interns
                  .filter((i) => i.userId === user.id)
                  .map((i) => i.id);
                const userAssigns = assignments.filter(
                  (a) =>
                    userInternIds.includes(a.internId) &&
                    a.startDate <= todayStr &&
                    (!a.endDate || a.endDate >= todayStr),
                );
                const userShiftNames = userAssigns
                  .map((a) => shifts.find((s) => s.id === a.shiftId)?.name)
                  .filter(Boolean)
                  .join(", ");

                return (
                  <div
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all select-none text-left border border-transparent ${
                      isSelected
                        ? "bg-red-950/20"
                        : "hover:bg-muted/10"
                    }`}
                  >
                    <Avatar className={`size-8.5 shrink-0 border ${isSelected ? "border-red-900/50" : "border-border/30"}`}>
                      <AvatarImage
                        src={user.image || undefined}
                        alt={user.name}
                      />
                      <AvatarFallback className={`${isSelected ? "bg-red-950 text-red-400" : "bg-muted text-muted-foreground"} text-xs font-extrabold`}>
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="truncate text-xs font-bold text-foreground">
                        {user.name}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`size-1.5 rounded-full ${userShiftNames ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
                        <span className="truncate text-[10px] text-muted-foreground">
                          {userShiftNames || "Belum ada shift"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>

      {/* Right Column: Attendance & Shift Controls */}
      <div className="lg:col-span-3 flex flex-col gap-6 min-h-0">
        {selectedUser ? (
          <>
            {/* Top Card: Summary & Shift Details */}
            <Card className="p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-6 shrink-0 bg-background/50 border-border/40 shadow-none">
              <div className="flex-1">
                <h4 className="text-sm font-bold text-foreground mb-1">
                  Ringkasan Kehadiran Hari Ini
                </h4>
                <p className="text-xs text-muted-foreground mb-4">
                  Total kehadiran {selectedUser?.name} bulan ini
                </p>
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-3 bg-muted/10 border border-border/30 rounded-lg p-2.5 min-w-[120px] flex-1">
                    <div className="size-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                       <span className="size-2 rounded-full bg-emerald-500" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground font-semibold uppercase">Hadir</p>
                      <p className="text-lg font-bold text-foreground">{stats.hadir}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-muted/10 border border-border/30 rounded-lg p-2.5 min-w-[120px] flex-1">
                    <div className="size-8 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                       <span className="size-2 rounded-full bg-amber-500" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground font-semibold uppercase">Terlambat</p>
                      <p className="text-lg font-bold text-foreground">{stats.terlambat}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-muted/10 border border-border/30 rounded-lg p-2.5 min-w-[120px] flex-1">
                    <div className="size-8 rounded-full bg-sky-500/10 flex items-center justify-center shrink-0">
                       <span className="size-2 rounded-full bg-sky-500" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground font-semibold uppercase">Izin</p>
                      <p className="text-lg font-bold text-foreground">{stats.izin}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-muted/10 border border-border/30 rounded-lg p-2.5 min-w-[120px] flex-1">
                    <div className="size-8 rounded-full bg-violet-500/10 flex items-center justify-center shrink-0">
                       <span className="size-2 rounded-full bg-violet-500" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground font-semibold uppercase">Sakit</p>
                      <p className="text-lg font-bold text-foreground">{stats.sakit}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-muted/10 border border-border/30 rounded-lg p-2.5 min-w-[120px] flex-1">
                    <div className="size-8 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                       <span className="size-2 rounded-full bg-destructive" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground font-semibold uppercase">Alpa</p>
                      <p className="text-lg font-bold text-foreground">{stats.alpa}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Shift Details */}
              <div className="xl:w-[240px] xl:border-l xl:border-border/40 xl:pl-6 shrink-0 flex flex-col gap-2 justify-center">
                <p className="text-[10px] text-muted-foreground font-semibold">
                  Shift Kerja Aktif
                </p>
                {activeShifts.length > 0 ? (
                  <p className="text-xs font-bold text-emerald-500">
                    {activeShifts.map((s) => s.name).join(", ")}
                  </p>
                ) : (
                  <p className="text-xs text-red-400 font-bold">
                    Belum Ada Shift Aktif
                  </p>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAssignDialogOpen(true)}
                  className="rounded-lg border-border/30 h-8 mt-1 text-xs w-fit bg-muted/10 hover:bg-muted/30 flex items-center gap-1.5"
                >
                  <UserCog className="size-3.5" /> Atur Shift
                </Button>
              </div>
            </Card>

            {/* Bottom Card: Attendance Calendar Display */}
            <Card className="flex-1 flex flex-col min-h-0 p-5 bg-background/50 border-border/40 shadow-none">
              {/* Calendar Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0 mb-4">
                <div className="space-y-0.5">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <CalendarDays className="size-4.5 text-red-400" />
                    {isMobile
                      ? "Riwayat Presensi Mingguan"
                      : "Riwayat Presensi Bulanan"}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Klik hari kerja untuk mengoverride presensi peserta magang.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGoToToday}
                    className="rounded-lg font-semibold text-xs h-8 px-3 border-border/30 bg-muted/10 hover:bg-muted/30"
                  >
                    {isMobile ? "Minggu Ini" : "Hari Ini"}
                  </Button>
                  <div className="flex items-center gap-1 rounded-lg border border-border/30 bg-muted/10 p-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handlePrevMonth}
                      className="size-7 rounded-md hover:bg-muted/30"
                    >
                      <ChevronLeft className="size-3.5 text-muted-foreground" />
                    </Button>
                    <div className="w-32 text-center text-xs font-bold tracking-wide px-1">
                      {isMobile
                        ? formatWeekRange(currentMonth)
                        : format(currentMonth, "MMMM yyyy", { locale: id })}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleNextMonth}
                      className="size-7 rounded-md hover:bg-muted/30"
                    >
                      <ChevronRight className="size-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* No more refreshTrigger — UserAttendances uses stores internally */}
              <UserAttendances
                internIds={interns
                  .filter((i) => i.userId === selectedUser.id)
                  .map((i) => i.id)}
                currentMonth={currentMonth}
                onDayClick={handleCalendarDayClick}
              />

              {/* Attendance Legend */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-4 justify-center text-[10px] text-muted-foreground font-semibold shrink-0 border-t border-border/20 mt-4">
                <span className="flex items-center gap-1">
                  <span className="size-2 rounded-full bg-emerald-500" /> Hadir
                </span>
                <span className="flex items-center gap-1">
                  <span className="size-2 rounded-full bg-amber-500" />{" "}
                  Terlambat
                </span>
                <span className="flex items-center gap-1">
                  <span className="size-2 rounded-full bg-sky-500" /> Sakit
                </span>
                <span className="flex items-center gap-1">
                  <span className="size-2 rounded-full bg-violet-500" /> Izin
                </span>
                <span className="flex items-center gap-1">
                  <span className="size-2 rounded-full bg-destructive" /> Alpa
                </span>
                <span className="flex items-center gap-1">
                  <span className="size-2 rounded-full bg-muted-foreground/35" />{" "}
                  Belum Absen
                </span>
              </div>
            </Card>
          </>
        ) : (
          <Card className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3 bg-background/50 border-border/40 shadow-none p-12">
            <CalendarDays className="size-10 text-muted-foreground/40" />
            <p className="text-xs">
              Silakan pilih peserta magang di sebelah kiri untuk melihat detail
              presensi.
            </p>
          </Card>
        )}
      </div>

      {/* User Shift Assignment Dialog */}
      {selectedUser && (
        <UserShiftEditDialog
          open={isAssignDialogOpen}
          onOpenChange={setIsAssignDialogOpen}
          userId={selectedUser.id}
          userName={selectedUser.name}
          onSuccess={handleRefreshSuccess}
        />
      )}

      {/* Attendance Override Dialogs */}
      {selectedUser &&
        (overrideExisting ? (
          <UserAttendanceEditDialog
            open={isOverrideOpen}
            onOpenChange={setIsOverrideOpen}
            userName={selectedUser.name}
            date={overrideDate}
            schedule={overrideSchedule}
            existingAttendance={overrideExisting}
            onSuccess={handleRefreshSuccess}
          />
        ) : (
          <UserAttendanceCreateDialog
            open={isOverrideOpen}
            onOpenChange={setIsOverrideOpen}
            userId={selectedUser.id}
            userName={selectedUser.name}
            date={overrideDate}
            schedule={overrideSchedule}
            onSuccess={handleRefreshSuccess}
          />
        ))}

      {/* Export Attendance Dialog */}
      <ExportAttendanceDialog
        open={isExportOpen}
        onOpenChange={setIsExportOpen}
        users={users}
        shifts={shifts}
        assignments={assignments}
        interns={interns}
      />
    </div>
  );
}
