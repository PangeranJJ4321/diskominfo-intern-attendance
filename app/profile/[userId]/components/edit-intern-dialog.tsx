"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { updateIntern } from "@/lib/services/interns";
import { toast } from "sonner";
import type { EditInternDialogProps } from "@/interfaces/profile";

/**
 * Dialog for editing an existing intern record with agency, institution, and date range selection.
 *
 * @param {EditInternDialogProps} props - The component props.
 * @returns {React.JSX.Element} The rendered edit intern dialog.
 */
export function EditInternDialog({
  intern,
  agencies,
  institutions,
  onSuccess,
  onDelete,
  open,
  onOpenChange,
}: EditInternDialogProps) {
  const [agencyId, setAgencyId] = useState(intern.agencyId);
  const [institutionId, setInstitutionId] = useState(
    intern.institutionId ?? "",
  );
  const [startDate, setStartDate] = useState<Date | undefined>(
    intern.startedAt ? new Date(intern.startedAt) : undefined,
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    intern.finishedAt ? new Date(intern.finishedAt) : undefined,
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  /** Handles form submission */
  async function handleSubmit() {
    if (!agencyId) {
      setError("Pilih instansi tujuan magang.");
      return;
    }
    if (!startDate) {
      setError("Pilih tanggal mulai magang.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const payload: Record<string, unknown> = {
        agencyId,
        institutionId: institutionId || null,
        startedAt: startDate.toISOString(),
        finishedAt: endDate ? endDate.toISOString() : null,
      };

      const result = await updateIntern(intern.id, payload);
      toast.success("Data magang berhasil diperbarui");
      onSuccess(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal memperbarui data magang",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Data Magang</DialogTitle>
          <DialogDescription>
            Ubah instansi tujuan, institusi asal, dan durasi magang.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Agency Selection */}
          <div className="space-y-2">
            <Label htmlFor="edit-agency-select">Instansi Tujuan</Label>
            <Select value={agencyId} onValueChange={setAgencyId}>
              <SelectTrigger id="edit-agency-select">
                <SelectValue placeholder="Pilih instansi tujuan" />
              </SelectTrigger>
              <SelectContent>
                {agencies.map((agency) => (
                  <SelectItem key={agency.id} value={agency.id}>
                    {agency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Institution Selection */}
          <div className="space-y-2">
            <Label htmlFor="edit-institution-select">Institusi Asal</Label>
            <Select value={institutionId} onValueChange={setInstitutionId}>
              <SelectTrigger id="edit-institution-select">
                <SelectValue placeholder="Pilih institusi asal (opsional)" />
              </SelectTrigger>
              <SelectContent>
                {institutions.map((inst) => (
                  <SelectItem key={inst.id} value={inst.id}>
                    {inst.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range: Start Date */}
          <div className="space-y-2">
            <Label>Tanggal Mulai Magang</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate
                    ? new Intl.DateTimeFormat("id-ID", {
                        dateStyle: "medium",
                      }).format(startDate)
                    : "Pilih tanggal mulai"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Date Range: End Date */}
          <div className="space-y-2">
            <Label>Tanggal Selesai Magang (Opsional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate
                    ? new Intl.DateTimeFormat("id-ID", {
                        dateStyle: "medium",
                      }).format(endDate)
                    : "Pilih tanggal selesai"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  disabled={startDate ? { before: startDate } : undefined}
                />
              </PopoverContent>
            </Popover>
          </div>

          {error && (
            <p className="text-sm text-destructive font-medium">{error}</p>
          )}
        </div>

        <div className="flex justify-between">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => onDelete(intern.id)}
          >
            Hapus
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button onClick={handleSubmit} loading={submitting}>
              Simpan
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default EditInternDialog;
