"use client";

import { useState } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale"; // Indonesian locale for friendly display
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
import { createHoliday } from "@/lib/services/holidays";
import { useHolidayStore } from "@/stores/holiday-store";
import type { HolidayCreateDialogProps } from "@/interfaces/admin";

/**
 * Component for creating a new holiday.
 *
 * @param props - Component properties.
 */
export default function HolidayCreateDialog({
  open,
  onOpenChange,
  selectedDate,
  onSuccessAdd,
}: HolidayCreateDialogProps) {
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!selectedDate) return null;

  /**
   * Handles saving the holiday to the database.
   *
   * @param e - Form event.
   */
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      toast.error("Keterangan hari libur tidak boleh kosong");
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedDate = format(selectedDate, "yyyy-MM-dd");
      const newHoliday = await createHoliday({
        date: formattedDate,
        description: description.trim(),
      });

      // Update both the local parent state (for admin tab UI) and the global
      // Zustand store so that cross-component consumers (e.g. user-attendances)
      // react to the change immediately.
      onSuccessAdd(newHoliday);
      useHolidayStore.getState().addHoliday(newHoliday);
      toast.success("Hari libur berhasil ditambahkan");
      setDescription("");
      onOpenChange(false);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Gagal menambahkan hari libur";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) setDescription("");
        onOpenChange(val);
      }}
    >
      <DialogContent className="sm:max-w-md max-h-[90dvh] overflow-y-auto scrollbar-none p-4 sm:p-6">
        <DialogHeader className="space-y-1.5">
          <DialogTitle className="text-xl font-bold tracking-tight bg-linear-to-r from-foreground to-foreground/80 bg-clip-text">
            Tambah Hari Libur
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground font-medium">
            {format(selectedDate, "EEEE, d MMMM yyyy", { locale: id })}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-6 pt-2">
          <div className="space-y-2">
            <Label
              htmlFor="desc"
              className="text-sm font-semibold text-foreground/90"
            >
              Keterangan Hari Libur
            </Label>
            <Input
              id="desc"
              placeholder="Misal: Cuti Bersama Idul Fitri"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              autoFocus
              className="w-full bg-background border-border hover:border-foreground/20 focus-visible:ring-primary/40 rounded-lg px-4 py-2.5 transition-all text-sm shadow-sm"
            />
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDescription("");
                onOpenChange(false);
              }}
              disabled={isSubmitting}
              className="w-full sm:w-auto rounded-lg hover:bg-muted font-medium transition-all"
            >
              Batal
            </Button>
            <Button
              type="submit"
              loading={isSubmitting}
              disabled={!description.trim() || isSubmitting}
              className="w-full sm:w-auto bg-primary hover:bg-primary/95 text-primary-foreground font-medium rounded-lg shadow-sm transition-all disabled:opacity-50"
            >
              Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
