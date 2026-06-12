"use client";

import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
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
import { getUsers } from "@/lib/services/users";
import { getShifts } from "@/lib/services/shifts";
import { getShiftAssignments } from "@/lib/services/shift-assignments";
import { getInterns } from "@/lib/services/interns";
import type {
  User,
  Intern,
  Shift,
  ShiftAssignment,
  Schedule,
  Attendance,
} from "@/interfaces/models";

/**
 * Renders the admin dashboard user attendance management card.
 *
 * @returns {React.JSX.Element} The rendered user attendance control card.
 */
export default function UserAttendancesCard() {
  const isMobile = useIsMobile();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [shifts, setShifts] = useState<Shift[]>([]);
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([]);
  const [interns, setInterns] = useState<Intern[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Date State for Calendar
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [refreshCounter, setRefreshCounter] = useState(0);
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

  useEffect(() => {
    const timer = setTimeout(() => setIsClient(true), 0);
    let cancelled = false;
    async function loadData() {
      setIsLoading(true);
      try {
        const [loadedUsers, loadedShifts, loadedAssignments, loadedInterns] =
          await Promise.all([
            getUsers(),
            getShifts(),
            getShiftAssignments(),
            getInterns(),
          ]);
        if (!cancelled) {
          setUsers(loadedUsers);
          setShifts(loadedShifts);
          setAssignments(loadedAssignments);
          setInterns(loadedInterns);

          // Auto select first user if not selected or update selected user references
          setSelectedUser((prev) => {
            if (!prev && loadedUsers.length > 0) {
              return loadedUsers[0];
            }
            if (prev) {
              const updatedUser = loadedUsers.find((u) => u.id === prev.id);
              if (updatedUser) {
                return updatedUser;
              }
            }
            return prev;
          });
        }
      } catch (err) {
        console.error("Gagal memuat data", err);
        toast.error("Gagal memuat data peserta magang");
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }
    void loadData();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [refreshCounter]);

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

  const handleOpenAssignDialog = () => {
    setIsAssignDialogOpen(true);
  };

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
      .filter((s): s is Shift => !!s);
  }, [activeAssignments, shifts]);

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
      {/* Left Sidebar: Employee List Wrapper */}
      {/* Added h-[350px] for mobile constraint, reverting to lg:h-auto for desktop */}
      <div className="lg:col-span-1 relative h-87.5 lg:h-auto lg:min-h-0">
        <Card className="flex flex-col overflow-hidden p-4 w-full h-full lg:absolute lg:inset-0">
          <div className="space-y-3 pb-3 border-b border-border/40 shrink-0">
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
                className="pl-9 bg-background/50 border-border rounded-lg text-xs h-9"
              />
            </div>
          </div>

          {/* Scrollable List with Custom Thin Scrollbar */}
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
                    className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all select-none border text-left ${
                      isSelected
                        ? "bg-primary/10 border-primary/25"
                        : "bg-transparent border-transparent hover:bg-muted/40"
                    }`}
                  >
                    <Avatar className="size-8.5 shrink-0 border border-border/45">
                      <AvatarImage
                        src={user.image || undefined}
                        alt={user.name}
                      />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-extrabold">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="truncate text-xs font-bold text-foreground">
                        {user.name}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {userShiftNames || "Belum ada shift"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>

      {/* Right Column: Attendance & Shift Controls */}
      <Card className="lg:col-span-3 overflow-hidden p-6 flex flex-col min-h-0">
        {selectedUser ? (
          <div className="space-y-5 flex-1 flex flex-col min-h-0">
            {/* Top Bar: User Details + Shift Assignment Action */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/20 p-4 rounded-lg border border-border shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="size-11 shrink-0 border border-border/60">
                  <AvatarImage
                    src={selectedUser.image || undefined}
                    alt={selectedUser.name}
                  />
                  <AvatarFallback className="bg-primary/15 text-primary text-xs font-extrabold">
                    {getInitials(selectedUser.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0">
                  <h3 className="font-extrabold text-sm text-foreground truncate">
                    {selectedUser.name}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate">
                    {selectedUser.email}
                  </p>
                </div>
              </div>

              {/* Active Shift Details */}
              <div className="flex items-center gap-4">
                <div className="text-right hidden md:block">
                  <p className="text-xs text-muted-foreground font-semibold">
                    Shift Kerja Aktif
                  </p>
                  {activeShifts.length > 0 ? (
                    <p className="text-xs font-bold text-foreground">
                      {activeShifts.map((s) => s.name).join(", ")}
                    </p>
                  ) : (
                    <p className="text-xs text-destructive font-bold">
                      Belum Ada Shift
                    </p>
                  )}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleOpenAssignDialog}
                  className="rounded-lg border-border h-9 text-xs flex items-center gap-1 font-semibold"
                >
                  <UserCog className="size-4" /> Atur Shift
                </Button>
              </div>
            </div>

            {/* Attendance Calendar Display */}
            <div className="flex-1 flex flex-col min-h-0 space-y-4">
              {/* Calendar Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
                <div className="space-y-0.5">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <CalendarDays className="size-4.5 text-primary/80" />
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
                    className="rounded-lg font-semibold text-xs h-8 px-2.5"
                  >
                    {isMobile ? "Minggu Ini" : "Hari Ini"}
                  </Button>
                  <div className="flex items-center gap-1 rounded-lg border border-border bg-card/60 p-0.5 shadow-sm">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handlePrevMonth}
                      className="size-7 rounded-lg"
                    >
                      <ChevronLeft className="size-3.5" />
                    </Button>
                    <div className="w-36 text-center text-xs font-bold tracking-wide px-1">
                      {isMobile
                        ? formatWeekRange(currentMonth)
                        : format(currentMonth, "MMMM yyyy", { locale: id })}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleNextMonth}
                      className="size-7 rounded-lg"
                    >
                      <ChevronRight className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </div>

              <UserAttendances
                internIds={interns
                  .filter((i) => i.userId === selectedUser.id)
                  .map((i) => i.id)}
                currentMonth={currentMonth}
                onDayClick={handleCalendarDayClick}
                refreshTrigger={refreshCounter}
              />

              {/* Attendance Legend */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-2 justify-center text-xs text-muted-foreground font-semibold shrink-0">
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
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
            <CalendarDays className="size-10 text-muted-foreground/40" />
            <p className="text-xs">
              Silakan pilih peserta magang di sebelah kiri untuk melihat detail
              presensi.
            </p>
          </div>
        )}
      </Card>

      {/* User Shift Assignment Dialog */}
      {selectedUser && (
        <UserShiftEditDialog
          open={isAssignDialogOpen}
          onOpenChange={setIsAssignDialogOpen}
          userId={selectedUser.id}
          userName={selectedUser.name}
          onSuccess={() => setRefreshCounter((prev) => prev + 1)}
        />
      )}

      {/* Attendance Override Dialog */}
      {selectedUser &&
        (overrideExisting ? (
          <UserAttendanceEditDialog
            open={isOverrideOpen}
            onOpenChange={setIsOverrideOpen}
            userName={selectedUser.name}
            date={overrideDate}
            schedule={overrideSchedule}
            existingAttendance={overrideExisting}
            onSuccess={() => setRefreshCounter((prev) => prev + 1)}
          />
        ) : (
          <UserAttendanceCreateDialog
            open={isOverrideOpen}
            onOpenChange={setIsOverrideOpen}
            userId={selectedUser.id}
            userName={selectedUser.name}
            date={overrideDate}
            schedule={overrideSchedule}
            onSuccess={() => setRefreshCounter((prev) => prev + 1)}
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
