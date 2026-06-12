"use client";

import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import { Trash2 } from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateHoliday, deleteHoliday } from "@/lib/services/holidays";
import type { HolidayEditDialogProps } from "@/interfaces/admin";

/**
 * Component for editing and deleting an existing holiday.
 *
 * @param props - Component properties.
 */
export default function HolidayEditDialog({
  open,
  onOpenChange,
  holiday,
  onSuccessUpdate,
  onSuccessDelete,
}: HolidayEditDialogProps) {
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    const desc = holiday ? holiday.description : "";
    const timer = setTimeout(() => {
      setDescription(desc);
    }, 0);
    return () => clearTimeout(timer);
  }, [holiday, open]);

  if (!holiday) return null;

  const parsedDate = parseISO(holiday.date);

  /**
   * Saves the updated holiday description to the database.
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
      const updatedHoliday = await updateHoliday(holiday.id, {
        description: description.trim(),
      });

      onSuccessUpdate(updatedHoliday);
      toast.success("Hari libur berhasil diperbarui");
      onOpenChange(false);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Gagal memperbarui hari libur";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Deletes the holiday from the database.
   */
  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      await deleteHoliday(holiday.id);
      onSuccessDelete(holiday.id);
      toast.success("Hari libur berhasil dihapus");
      onOpenChange(false);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Gagal menghapus hari libur";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md max-h-[90dvh] overflow-y-auto scrollbar-none p-4 sm:p-6">
          <DialogHeader className="space-y-1.5">
            <DialogTitle className="text-xl font-bold tracking-tight bg-linear-to-r from-foreground to-foreground/80 bg-clip-text">
              Edit Hari Libur
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground font-medium">
              {format(parsedDate, "EEEE, d MMMM yyyy", { locale: id })}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-6 pt-2">
            <div className="space-y-2">
              <Label
                htmlFor="edit-desc"
                className="text-sm font-semibold text-foreground/90"
              >
                Keterangan Hari Libur
              </Label>
              <Input
                id="edit-desc"
                placeholder="Misal: Cuti Bersama Idul Fitri"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
                autoFocus
                className="w-full bg-background border-border hover:border-foreground/20 focus-visible:ring-primary/40 rounded-lg px-4 py-2.5 transition-all text-sm shadow-sm"
              />
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between items-stretch sm:items-center">
              <Button
                type="button"
                variant="destructive"
                onClick={() => setIsConfirmDeleteOpen(true)}
                disabled={isSubmitting}
                className="w-full sm:w-auto rounded-lg hover:bg-destructive/95 font-medium transition-all flex items-center justify-center gap-1.5 order-last sm:order-first shadow-sm"
              >
                <Trash2 className="size-4" />
                Hapus
              </Button>

              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto rounded-lg hover:bg-muted font-medium transition-all"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  loading={isSubmitting}
                  disabled={
                    !description.trim() ||
                    description.trim() === holiday.description ||
                    isSubmitting
                  }
                  className="w-full sm:w-auto bg-primary hover:bg-primary/95 text-primary-foreground font-medium rounded-lg shadow-sm transition-all disabled:opacity-50"
                >
                  Simpan
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Holiday Alert Dialog */}
      <AlertDialog
        open={isConfirmDeleteOpen}
        onOpenChange={setIsConfirmDeleteOpen}
      >
        <AlertDialogContent className="border border-border bg-card/90 backdrop-blur-md shadow-lg rounded-lg p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold">
              Hapus Hari Libur
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              Apakah Anda yakin ingin menghapus hari libur
              <strong> {holiday.description}</strong>? Tindakan ini tidak dapat
              dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex sm:justify-end gap-2 pt-2">
            <AlertDialogCancel className="rounded-lg text-xs h-9">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDelete}
              loading={isSubmitting}
              className="rounded-lg text-xs h-9 font-semibold"
            >
              Hapus Hari Libur
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
