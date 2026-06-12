"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { toast } from "sonner";
import { Calendar as CalendarIcon, Trash2, Plus } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { parseDateLocal } from "@/lib/date-utils";
import { Skeleton } from "@/components/ui/skeleton";
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
import { getShifts } from "@/lib/services/shifts";
import {
  getShiftAssignments,
  createShiftAssignment,
  deleteShiftAssignment,
} from "@/lib/services/shift-assignments";
import { useAssignmentStore } from "@/stores/assignment-store";
import type { Shift, ShiftAssignment } from "@/interfaces/models";
import type { UserShiftEditDialogProps } from "@/interfaces/admin";
import { Spinner } from "@/components/ui/spinner";

export default function UserShiftEditDialog({
  open,
  onOpenChange,
  internId,
  userName,
  onSuccess,
}: UserShiftEditDialogProps) {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [userAssignments, setUserAssignments] = useState<ShiftAssignment[]>([]);
  const [selectedShiftId, setSelectedShiftId] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  /**
   * Fetches fresh shifts and assignments for the selected user.
   */
  const loadData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const [freshShifts, allAssignments] = await Promise.all([
        getShifts(),
        getShiftAssignments(),
      ]);
      setShifts(freshShifts);
      setUserAssignments(allAssignments.filter((a) => a.internId === internId));

      // Set default form values
      if (freshShifts.length > 0) {
        setSelectedShiftId(freshShifts[0].id);
      }
      setDateRange({ from: new Date(), to: undefined });
    } catch (err) {
      console.error("Gagal memuat data penugasan shift", err);
      toast.error("Gagal memuat data penugasan shift");
    } finally {
      setIsLoadingData(false);
    }
  }, [internId]);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        void loadData();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [open, loadData]);

  /**
   * Handles form submission to assign a shift to a user.
   *
   * @param e - Form event.
   */
  const handleAddShiftAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShiftId || !dateRange?.from) {
      toast.error("Silakan lengkapi data shift");
      return;
    }

    setIsSubmitting(true);
    try {
      const isSameDay =
        dateRange.to &&
        format(dateRange.from, "yyyy-MM-dd") ===
          format(dateRange.to, "yyyy-MM-dd");

      const startDate = format(dateRange.from, "yyyy-MM-dd");
      const endDate =
        dateRange.to && !isSameDay ? format(dateRange.to, "yyyy-MM-dd") : null;

      const newAssignment = await createShiftAssignment({
        internId,
        shiftId: selectedShiftId,
        startDate,
        endDate,
      });

      toast.success(`Berhasil menambahkan penugasan shift untuk ${userName}`);
      await loadData();
      useAssignmentStore.getState().addAssignment(newAssignment);
      onSuccess();
    } catch (err) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : "Gagal menambahkan penugasan shift";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handles deleting a shift assignment.
   *
   * @param assignId - The ID of the assignment to delete.
   */
  const handleDeleteAssignment = async (assignId: string) => {
    setIsDeletingId(assignId);
    try {
      await deleteShiftAssignment(assignId);
      toast.success("Berhasil menghapus penugasan shift");
      await loadData();
      useAssignmentStore.getState().removeAssignment(assignId);
      onSuccess();
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Gagal menghapus penugasan shift";
      toast.error(errorMsg);
    } finally {
      setIsDeletingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90dvh] overflow-y-auto scrollbar-none p-4 sm:p-6">
        <DialogHeader className="shrink-0 pb-2 border-b border-border/40">
          <DialogTitle className="text-lg font-bold">
            Atur Shift Kerja — {userName}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Kelola daftar penugasan shift aktif dan riwayat penugasan karyawan.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 py-4 space-y-6 pr-1">
          {/* List of current shift assignments */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-foreground">
              Daftar Penugasan Aktif & Riwayat
            </h4>
            {isLoadingData ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-background/50 text-xs">
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-24 rounded" />
                    <Skeleton className="h-3.5 w-40 rounded" />
                  </div>
                  <Skeleton className="size-8 rounded-md shrink-0" />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-background/50 text-xs">
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-28 rounded" />
                    <Skeleton className="h-3.5 w-36 rounded" />
                  </div>
                  <Skeleton className="size-8 rounded-md shrink-0" />
                </div>
              </div>
            ) : userAssignments.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-border rounded-lg bg-muted/5">
                <p className="text-xs text-muted-foreground font-medium">
                  Belum ada penugasan shift untuk karyawan ini.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {userAssignments.map((assign) => (
                  <div
                    key={assign.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-background/50 hover:bg-background/80 transition-all text-xs"
                  >
                    <div className="space-y-0.5">
                      <p className="font-bold text-foreground">
                        {assign.shift?.name || "Shift Tidak Dikenal"}
                      </p>
                      <p className="text-muted-foreground font-semibold">
                        {format(
                          parseDateLocal(assign.startDate),
                          "dd MMMM yyyy",
                          {
                            locale: id,
                          },
                        )}{" "}
                        —{" "}
                        {assign.endDate
                          ? format(
                              parseDateLocal(assign.endDate),
                              "dd MMMM yyyy",
                              {
                                locale: id,
                              },
                            )
                          : "Tanpa batas akhir"}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-md shrink-0 transition-colors"
                      onClick={() => handleDeleteAssignment(assign.id)}
                      disabled={isDeletingId !== null || isSubmitting}
                      title="Hapus penugasan"
                    >
                      {isDeletingId === assign.id ? (
                        <Spinner className="size-4" />
                      ) : (
                        <Trash2 className="size-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form to add new assignment */}
          <form
            onSubmit={handleAddShiftAssignment}
            className="space-y-4 pt-4 border-t border-border/40"
          >
            <h4 className="text-xs font-bold text-foreground">
              Tambah Penugasan Shift Baru
            </h4>

            {/* Shift Selector */}
            <div className="space-y-1.5">
              <Label htmlFor="assign-shift" className="text-xs font-semibold">
                Pilih Shift Kerja
              </Label>
              <Select
                value={selectedShiftId}
                onValueChange={setSelectedShiftId}
                disabled={isSubmitting || isDeletingId !== null}
              >
                <SelectTrigger
                  id="assign-shift"
                  className="w-full rounded-lg bg-background border-border text-sm"
                >
                  <SelectValue placeholder="Pilih Shift" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border rounded-lg">
                  {shifts.map((s) => (
                    <SelectItem
                      key={s.id}
                      value={s.id}
                      className="rounded-md cursor-pointer text-sm"
                    >
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range Selection (Shadcn Calendar in Popover) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">
                Periode Shift Kerja (Tanggal Berakhir Opsional)
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date-range-picker"
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal rounded-lg border-border bg-background px-3 py-2 text-sm h-10 shadow-sm",
                      !dateRange?.from && "text-muted-foreground",
                    )}
                    disabled={isSubmitting || isDeletingId !== null}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                    {dateRange?.from ? (
                      dateRange.to &&
                      format(dateRange.from, "yyyy-MM-dd") !==
                        format(dateRange.to, "yyyy-MM-dd") ? (
                        <>
                          {format(dateRange.from, "dd MMMM yyyy", {
                            locale: id,
                          })}{" "}
                          -{" "}
                          {format(dateRange.to, "dd MMMM yyyy", {
                            locale: id,
                          })}
                        </>
                      ) : (
                        <>
                          {format(dateRange.from, "dd MMMM yyyy", {
                            locale: id,
                          })}{" "}
                          (Tanpa batas akhir)
                        </>
                      )
                    ) : (
                      <span>Pilih periode shift kerja</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 rounded-lg border border-border bg-popover"
                  align="start"
                >
                  <Calendar
                    mode="range"
                    defaultMonth={dateRange?.from || new Date()}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={1}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Button
              type="submit"
              loading={isSubmitting}
              disabled={
                !selectedShiftId ||
                !dateRange?.from ||
                isSubmitting ||
                isDeletingId !== null
              }
              className="w-full rounded-lg text-xs bg-primary text-primary-foreground font-semibold shadow-sm flex items-center justify-center gap-1.5 h-9"
            >
              {!isSubmitting && <Plus className="size-3.5" />}
              Tambah Penugasan
            </Button>
          </form>
        </div>

        <DialogFooter className="shrink-0 pt-3 border-t border-border/40">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting || isDeletingId !== null}
            className="w-full sm:w-auto rounded-lg text-xs"
          >
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
