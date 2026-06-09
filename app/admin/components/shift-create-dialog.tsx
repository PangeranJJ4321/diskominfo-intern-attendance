"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createShift } from "@/lib/services/shifts";
import type { ShiftCreateDialogProps } from "@/interfaces/admin";
import { Switch } from "@/components/ui/switch";
/**
 * Component for creating a new shift.
 *
 * @param props - Component properties.
 */
export default function ShiftCreateDialog({
  open,
  onOpenChange,
  onSuccess,
}: ShiftCreateDialogProps) {
  const [name, setName] = useState("");
  const [workOnHolidays, setWorkOnHolidays] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Handles form submission to create a new shift.
   *
   * @param e - Form event.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Nama shift tidak boleh kosong");
      return;
    }

    setIsSubmitting(true);
    try {
      const newShift = await createShift(name.trim(), workOnHolidays);
      onSuccess(newShift);
      setName("");
      setWorkOnHolidays(false);
      onOpenChange(false);
      toast.success("Shift baru berhasil dibuat");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Gagal membuat shift";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90dvh] overflow-y-auto scrollbar-none p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Tambah Shift Baru</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Tentukan nama untuk grup jadwal kerja ini.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="create-shift-name" className="text-xs font-semibold">
              Nama Shift
            </Label>
            <Input
              id="create-shift-name"
              placeholder="Misal: Shift Pagi Satpam, Shift Reguler Kantor"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              autoFocus
              className="w-full bg-background rounded-lg border-border px-4 py-2 text-sm"
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3.5 shadow-sm bg-background/50">
            <div className="space-y-0.5">
              <Label htmlFor="create-shift-work-on-holidays" className="text-xs font-bold text-foreground">
                Tetap Masuk Hari Libur
              </Label>
              <p className="text-[11px] text-muted-foreground font-medium leading-normal">
                Harus absen walaupun bertepatan dengan Hari Libur.
              </p>
            </div>
            <Switch
              id="create-shift-work-on-holidays"
              checked={workOnHolidays}
              onCheckedChange={setWorkOnHolidays}
              disabled={isSubmitting}
            />
          </div>
          <DialogFooter className="flex sm:justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
              className="rounded-lg text-xs"
            >
              Batal
            </Button>
            <Button
              type="submit"
              loading={isSubmitting}
              disabled={!name.trim() || isSubmitting}
              className="rounded-lg text-xs bg-primary text-primary-foreground font-semibold"
            >
              Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
