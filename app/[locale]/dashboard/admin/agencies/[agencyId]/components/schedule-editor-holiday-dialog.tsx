"use client";

import { useState } from "react";
import { format } from "date-fns";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Holiday = {
  id: string;
  date: Date;
  description: string;
};

type ScheduleEditorHolidayDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agencyId: string;
  selectedDate: Date;
  editingHoliday: Holiday | null;
  onSuccessAdd: (holiday: Holiday) => void;
  onSuccessUpdate: (holiday: Holiday) => void;
  onSuccessDelete: (id: string) => void;
};

export default function ScheduleEditorHolidayDialog({
  open,
  onOpenChange,
  agencyId,
  selectedDate,
  editingHoliday,
  onSuccessAdd,
  onSuccessUpdate,
  onSuccessDelete,
}: ScheduleEditorHolidayDialogProps) {
  const dialogKey = `${open ? "open" : "closed"}-${editingHoliday?.id ?? "new"}-${format(selectedDate, "yyyy-MM-dd")}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-106.25">
        <HolidayDialogForm
          key={dialogKey}
          agencyId={agencyId}
          selectedDate={selectedDate}
          editingHoliday={editingHoliday}
          onOpenChange={onOpenChange}
          onSuccessAdd={onSuccessAdd}
          onSuccessUpdate={onSuccessUpdate}
          onSuccessDelete={onSuccessDelete}
        />
      </DialogContent>
    </Dialog>
  );
}

type HolidayDialogFormProps = Omit<ScheduleEditorHolidayDialogProps, "open">;

function HolidayDialogForm({
  agencyId,
  selectedDate,
  editingHoliday,
  onOpenChange,
  onSuccessAdd,
  onSuccessUpdate,
  onSuccessDelete,
}: HolidayDialogFormProps) {
  const [description, setDescription] = useState(
    editingHoliday?.description || "",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) return;

    setIsSubmitting(true);
    const formattedDate = format(selectedDate, "yyyy-MM-dd");

    try {
      if (editingHoliday) {
        const response = await fetch(
          `/api/agency-holidays/${editingHoliday.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              date: formattedDate,
              description,
            }),
          },
        );

        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(body.error || "Gagal memperbarui hari libur");
        }

        const updated = await response.json();
        onSuccessUpdate({
          id: updated.id,
          date: new Date(updated.date),
          description: updated.description,
        });
        toast.success("Hari libur berhasil diperbarui");
      } else {
        const response = await fetch("/api/agency-holidays", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agencyId,
            date: formattedDate,
            description,
          }),
        });

        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(body.error || "Gagal membuat hari libur");
        }

        const created = await response.json();
        onSuccessAdd({
          id: created.id,
          date: new Date(created.date),
          description: created.description,
        });
        toast.success("Hari libur berhasil ditambahkan");
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
    if (!editingHoliday) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/agency-holidays/${editingHoliday.id}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(body.error || "Gagal menghapus hari libur");
      }

      onSuccessDelete(editingHoliday.id);
      toast.success("Hari libur berhasil dihapus");
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
          {editingHoliday ? "Edit Hari Libur" : "Tambah Hari Libur"}
        </DialogTitle>
        <DialogDescription>
          {format(selectedDate, "EEEE, d MMMM yyyy")}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSave}>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="desc">Keterangan</Label>
            <Input
              id="desc"
              placeholder="Misal: Cuti Bersama Idul Fitri"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              autoFocus
            />
          </div>
        </div>

        <DialogFooter className="flex items-center sm:justify-between">
          {editingHoliday ? (
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
            <Button
              type="submit"
              disabled={!description.trim() || isSubmitting}
            >
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </DialogFooter>
      </form>
    </>
  );
}
