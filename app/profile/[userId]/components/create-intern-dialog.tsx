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
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { createIntern } from "@/lib/services/interns";
import { toast } from "sonner";
import type { CreateInternDialogProps } from "@/interfaces/profile";
import type { DateRange } from "react-day-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";

/**
 * Dialog for creating a new intern record with agency, institution, and date range selection.
 *
 * @param {CreateInternDialogProps} props - The component props.
 * @returns {React.JSX.Element} The rendered create intern dialog.
 */
export function CreateInternDialog({
  userId,
  agencies,
  institutions,
  onSuccess,
  open,
  onOpenChange,
}: CreateInternDialogProps) {
  const [agencyId, setAgencyId] = useState("");
  const [institutionId, setInstitutionId] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const isMobile = useIsMobile();

  /** Resets form state */
  function resetForm() {
    setAgencyId("");
    setInstitutionId("");
    setDateRange(undefined);
    setError("");
  }

  /** Handles dialog open change */
  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      resetForm();
    }
    onOpenChange(nextOpen);
  }

  /** Handles form submission */
  async function handleSubmit() {
    if (!agencyId) {
      setError("Pilih instansi tujuan magang.");
      return;
    }
    if (!dateRange?.from) {
      setError("Pilih tanggal mulai magang.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const payload = {
        userId,
        agencyId,
        institutionId: institutionId || null,
        startedAt: dateRange.from.toISOString(),
        finishedAt: dateRange.to ? dateRange.to.toISOString() : null,
      };

      const result = await createIntern(payload);
      toast.success("Data magang berhasil ditambahkan");
      onSuccess(result);
      resetForm();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal menambahkan data magang",
      );
    } finally {
      setSubmitting(false);
    }
  }

  /**
   * Formats the date range for display.
   *
   * @param range - The date range to format.
   * @returns The formatted date range string.
   */
  function formatDateRange(range: DateRange | undefined): string {
    if (!range?.from) return "Pilih durasi magang";
    const fmt = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" });
    if (range.to && range.from.getTime() !== range.to.getTime()) {
      return `${fmt.format(range.from)} — ${fmt.format(range.to)}`;
    }
    return fmt.format(range.from);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah Data Magang</DialogTitle>
          <DialogDescription>
            Pilih instansi tujuan, institusi asal, dan durasi magang.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Agency Selection */}
          <div className="space-y-2">
            <Label htmlFor="agency-select">Instansi Tujuan</Label>
            <Select value={agencyId} onValueChange={setAgencyId}>
              <SelectTrigger id="agency-select" className="w-full">
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
            <Label htmlFor="institution-select">Institusi Asal</Label>
            <Select value={institutionId} onValueChange={setInstitutionId}>
              <SelectTrigger id="institution-select" className="w-full">
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

          {/* Date Range Picker */}
          <div className="space-y-2">
            <Label>Durasi Magang</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateRange?.from && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formatDateRange(dateRange)}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto max-w-[calc(100vw-3rem)] overflow-auto p-0"
                align="start"
              >
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={isMobile ? 1 : 2}
                />
              </PopoverContent>
            </Popover>
          </div>

          {error && (
            <p className="text-sm text-destructive font-medium">{error}</p>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={submitting}
          >
            Batal
          </Button>
          <Button onClick={handleSubmit} loading={submitting}>
            Simpan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default CreateInternDialog;
