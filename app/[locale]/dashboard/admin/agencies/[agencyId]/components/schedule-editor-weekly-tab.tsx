"use client";

import { useEffect, useState } from "react";
import { Clock3, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { TabsContent } from "@/components/ui/tabs";

type DayLabel = {
  value: number;
  short: string;
  long: string;
  weekend: boolean;
};

type AgencySchedule = {
  id: string;
  agencyId: string;
  name: string;
  dayOfWeek: number;
  agencyScheduleStart: string;
  agencyScheduleEnd: string;
  createdAt: string;
  updatedAt: string;
};

type ScheduleEditorWeeklyTabProps = {
  agencyId: string;
};

type ScheduleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agencyId: string;
  selectedDay: number;
  editingSchedule: AgencySchedule | null;
  onSuccessAdd: (schedule: AgencySchedule) => void;
  onSuccessUpdate: (schedule: AgencySchedule) => void;
  onSuccessDelete: (id: string) => void;
};

type ScheduleDialogFormProps = Omit<ScheduleDialogProps, "open">;

const DAY_LABELS: DayLabel[] = [
  { value: 0, short: "Sun", long: "Sunday", weekend: true },
  { value: 1, short: "Mon", long: "Monday", weekend: false },
  { value: 2, short: "Tue", long: "Tuesday", weekend: false },
  { value: 3, short: "Wed", long: "Wednesday", weekend: false },
  { value: 4, short: "Thu", long: "Thursday", weekend: false },
  { value: 5, short: "Fri", long: "Friday", weekend: false },
  { value: 6, short: "Sat", long: "Saturday", weekend: true },
];

const DEFAULT_START_TIME = "08:00";
const DEFAULT_END_TIME = "17:15";

function normalizeTime(value: string): string {
  return value.length >= 5 ? value.slice(0, 5) : value;
}

function toApiTime(value: string): string {
  if (value.length === 5) {
    return `${value}:00`;
  }

  return value;
}

function formatTimeRange(schedule: AgencySchedule): string {
  return `${normalizeTime(schedule.agencyScheduleStart)} - ${normalizeTime(schedule.agencyScheduleEnd)}`;
}

function parseScheduleResponse(schedule: {
  id: string;
  agencyId: string;
  name: string;
  dayOfWeek: number;
  agencyScheduleStart: string;
  agencyScheduleEnd: string;
  createdAt: string;
  updatedAt: string;
}): AgencySchedule {
  return schedule;
}

function ScheduleEditorWeeklyTab({ agencyId }: ScheduleEditorWeeklyTabProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [schedules, setSchedules] = useState<AgencySchedule[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(1);
  const [editingSchedule, setEditingSchedule] = useState<AgencySchedule | null>(
    null,
  );

  useEffect(() => {
    if (!agencyId) {
      return;
    }

    const loadSchedules = async () => {
      setIsLoading(true);

      try {
        const response = await fetch(
          `/api/agency-schedules?limit=100&sortBy=dayOfWeek&sortOrder=asc&q=${agencyId}`,
        );

        if (!response.ok) {
          setSchedules([]);
          return;
        }

        const json = (await response.json()) as {
          data?: Array<{
            id: string;
            agencyId: string;
            name: string;
            dayOfWeek: number;
            agencyScheduleStart: string;
            agencyScheduleEnd: string;
            createdAt: string;
            updatedAt: string;
          }>;
        };

        const parsedSchedules = (json.data ?? [])
          .map((schedule) => parseScheduleResponse(schedule))
          .filter((schedule) => schedule.agencyId === agencyId);

        setSchedules(parsedSchedules);
      } catch {
        setSchedules([]);
      } finally {
        setIsLoading(false);
      }
    };

    void loadSchedules();
  }, [agencyId]);

  const visibleSchedules = agencyId ? schedules : [];
  const shouldShowLoading = Boolean(agencyId) && isLoading;

  const openScheduleModal = (dayOfWeek: number, schedule?: AgencySchedule) => {
    setSelectedDay(dayOfWeek);
    setEditingSchedule(schedule || null);
    setIsModalOpen(true);
  };

  const handleSuccessAdd = (schedule: AgencySchedule) => {
    setSchedules((current) => [...current, schedule]);
  };

  const handleSuccessUpdate = (updatedSchedule: AgencySchedule) => {
    setSchedules((current) =>
      current.map((schedule) =>
        schedule.id === updatedSchedule.id ? updatedSchedule : schedule,
      ),
    );
  };

  const handleSuccessDelete = (id: string) => {
    setSchedules((current) => current.filter((schedule) => schedule.id !== id));
  };

  if (!agencyId) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">
          Agency ID belum tersedia.
        </p>
      </Card>
    );
  }

  if (shouldShowLoading) {
    return (
      <Card className="flex flex-col items-center justify-center gap-4 p-10 text-muted-foreground">
        <Spinner className="size-8" />
        <p className="text-sm">Memuat jadwal mingguan</p>
      </Card>
    );
  }

  return (
    <TabsContent value="weekly" className="space-y-4 outline-none">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-1">
          <h3 className="text-base font-semibold">Jadwal Mingguan</h3>
          <p className="text-sm text-muted-foreground">
            Klik hari yang kosong untuk menambah jadwal, atau klik kartu yang
            sudah ada untuk mengubahnya.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border">
        <div className="hidden grid-cols-7 border-b bg-muted/30 text-center text-sm font-medium text-muted-foreground md:grid">
          {DAY_LABELS.map((dayLabel) => (
            <div
              key={dayLabel.short}
              className="py-3 text-xs uppercase tracking-wider"
            >
              <span className="hidden sm:inline">{dayLabel.long}</span>
              <span className="sm:hidden">{dayLabel.short}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-px bg-border md:grid-cols-7">
          {DAY_LABELS.map((dayLabel) => {
            const daySchedules = visibleSchedules
              .filter((schedule) => schedule.dayOfWeek === dayLabel.value)
              .sort((a, b) =>
                normalizeTime(a.agencyScheduleStart).localeCompare(
                  normalizeTime(b.agencyScheduleStart),
                ),
              );

            return (
              <div
                key={dayLabel.value}
                className={`flex min-h-56 flex-col bg-background md:min-h-80 ${
                  dayLabel.weekend ? "bg-muted/10" : ""
                }`}
              >
                <div className="flex flex-1 flex-col gap-3 p-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground md:hidden">
                    {dayLabel.long}
                  </div>

                  {daySchedules.length === 0 ? (
                    <button
                      type="button"
                      onClick={() => openScheduleModal(dayLabel.value)}
                      className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-muted-foreground/30 bg-muted/10 px-4 py-8 text-center text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted/20 md:py-8"
                    >
                      <Plus className="size-4" />
                      Tambah jadwal hari ini
                    </button>
                  ) : (
                    daySchedules.map((schedule) => (
                      <button
                        key={schedule.id}
                        type="button"
                        onClick={() =>
                          openScheduleModal(dayLabel.value, schedule)
                        }
                        className="group rounded-xl border bg-card px-4 py-3 text-left shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 space-y-1">
                            <p className="truncate text-sm font-semibold">
                              {schedule.name}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock3 className="size-3.5" />
                              <span>{formatTimeRange(schedule)}</span>
                            </div>
                          </div>
                          {/* isWorkDay removed from schema; badge omitted */}
                        </div>
                      </button>
                    ))
                  )}

                  {daySchedules.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => openScheduleModal(dayLabel.value)}
                      className="flex flex-col h-full items-center justify-center gap-2 rounded-xl border border-dashed border-muted-foreground/30 bg-muted/10 px-4 py-6 text-center text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted/20"
                    >
                      <Plus className="size-4" />
                      Tambah jadwal hari ini
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <ScheduleEditorScheduleDialog
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        agencyId={agencyId}
        selectedDay={selectedDay}
        editingSchedule={editingSchedule}
        onSuccessAdd={handleSuccessAdd}
        onSuccessUpdate={handleSuccessUpdate}
        onSuccessDelete={handleSuccessDelete}
      />
    </TabsContent>
  );
}

function ScheduleEditorScheduleDialog({
  open,
  onOpenChange,
  agencyId,
  selectedDay,
  editingSchedule,
  onSuccessAdd,
  onSuccessUpdate,
  onSuccessDelete,
}: ScheduleDialogProps) {
  const dialogKey = `${open ? "open" : "closed"}-${editingSchedule?.id ?? "new"}-${selectedDay}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <ScheduleEditorScheduleDialogForm
          key={dialogKey}
          agencyId={agencyId}
          selectedDay={selectedDay}
          editingSchedule={editingSchedule}
          onOpenChange={onOpenChange}
          onSuccessAdd={onSuccessAdd}
          onSuccessUpdate={onSuccessUpdate}
          onSuccessDelete={onSuccessDelete}
        />
      </DialogContent>
    </Dialog>
  );
}

function ScheduleEditorScheduleDialogForm({
  agencyId,
  selectedDay,
  editingSchedule,
  onOpenChange,
  onSuccessAdd,
  onSuccessUpdate,
  onSuccessDelete,
}: ScheduleDialogFormProps) {
  const [name, setName] = useState(editingSchedule?.name ?? "");
  const dayOfWeek = editingSchedule?.dayOfWeek ?? selectedDay;
  const [agencyScheduleStart, setAgencyScheduleStart] = useState(
    normalizeTime(editingSchedule?.agencyScheduleStart ?? DEFAULT_START_TIME),
  );
  const [agencyScheduleEnd, setAgencyScheduleEnd] = useState(
    normalizeTime(editingSchedule?.agencyScheduleEnd ?? DEFAULT_END_TIME),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: trimmedName,
        dayOfWeek,
        agencyScheduleStart: toApiTime(agencyScheduleStart),
        agencyScheduleEnd: toApiTime(agencyScheduleEnd),
      };

      const response = editingSchedule
        ? await fetch(`/api/agency-schedules/${editingSchedule.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/agency-schedules", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              agencyId,
              ...payload,
            }),
          });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as {
          error?: string | Record<string, string[]>;
        };
        const message = typeof body.error === "string" ? body.error : undefined;
        throw new Error(
          message ||
            (editingSchedule
              ? "Gagal memperbarui jadwal"
              : "Gagal menambahkan jadwal"),
        );
      }

      const saved = (await response.json()) as {
        id: string;
        agencyId: string;
        name: string;
        dayOfWeek: number;
        agencyScheduleStart: string;
        agencyScheduleEnd: string;
        createdAt: string;
        updatedAt: string;
      };

      const schedule = parseScheduleResponse(saved);

      if (editingSchedule) {
        onSuccessUpdate(schedule);
        toast.success("Jadwal berhasil diperbarui");
      } else {
        onSuccessAdd(schedule);
        toast.success("Jadwal berhasil ditambahkan");
      }

      onOpenChange(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingSchedule) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `/api/agency-schedules/${editingSchedule.id}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(body.error || "Gagal menghapus jadwal");
      }

      onSuccessDelete(editingSchedule.id);
      toast.success("Jadwal berhasil dihapus");
      onOpenChange(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {editingSchedule ? "Edit Jadwal Mingguan" : "Tambah Jadwal Mingguan"}
        </DialogTitle>
        <DialogDescription>Atur detail jadwal mingguan.</DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSave}>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama jadwal</Label>
            <Input
              id="name"
              placeholder="Misal: Shift Pagi"
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          {/* Removed isWorkDay toggle — field removed from schema */}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="start">Jam mulai absen</Label>
              <Input
                id="start"
                type="time"
                value={agencyScheduleStart}
                onChange={(event) => setAgencyScheduleStart(event.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end">Batas absen</Label>
              <Input
                id="end"
                type="time"
                value={agencyScheduleEnd}
                onChange={(event) => setAgencyScheduleEnd(event.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex items-center sm:justify-between">
          {editingSchedule ? (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              <Trash2 className="mr-2 size-4" /> Hapus
            </Button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" disabled={!name.trim() || isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </DialogFooter>
      </form>
    </>
  );
}

export default ScheduleEditorWeeklyTab;
