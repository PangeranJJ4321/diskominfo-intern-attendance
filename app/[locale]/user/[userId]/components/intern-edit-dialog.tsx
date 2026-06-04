"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { type DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateInternSchema } from "@/lib/schemas/intern";
import { toast } from "sonner";

interface InternEditDialogProps {
  internId: string;
  initialAgencyName: string;
  initialInstitutionId: string | null;
  initialStartedAt: Date;
  initialFinishedAt: Date | null;
}

/**
 * Dialog used to edit intern data while keeping the agency immutable.
 */
export function InternEditDialog({
  internId,
  initialAgencyName,
  initialInstitutionId,
  initialStartedAt,
  initialFinishedAt,
}: InternEditDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(false);

  const [institutionId, setInstitutionId] = useState(
    initialInstitutionId ?? "none",
  );
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: initialStartedAt,
    to: initialFinishedAt ?? undefined,
  });

  const [institutions, setInstitutions] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [error, setError] = useState("");

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (!nextOpen) return;

    setInstitutionId(initialInstitutionId ?? "none");
    setDateRange({
      from: initialStartedAt,
      to: initialFinishedAt ?? undefined,
    });
    setError("");
  };

  useEffect(() => {
    if (!open) return;

    let isActive = true;

    (async () => {
      setOptionsLoading(true);
      try {
        // Appended ?limit=100 to fetch all institutions
        const response = await fetch("/api/institutes?limit=100");
        if (!isActive) return;

        if (response.ok) {
          const data = await response.json();
          setInstitutions(Array.isArray(data.data) ? data.data : []);
        }
      } catch {
        // Ignore fetch errors and keep current values.
      } finally {
        if (isActive) {
          setOptionsLoading(false);
        }
      }
    })();

    return () => {
      isActive = false;
    };
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const startedAt = dateRange?.from;
    const finishedAt = dateRange?.to;

    if (!startedAt) {
      setError("Start date is required");
      return;
    }

    const institutionForSubmit =
      institutionId === "none" ? undefined : institutionId;

    const parsed = updateInternSchema.safeParse({
      institutionId: institutionForSubmit,
      startedAt,
      finishedAt,
    });

    if (!parsed.success) {
      setError(
        Object.values(parsed.error.flatten().fieldErrors).flat()[0] ||
          "Validation failed",
      );
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/interns/${internId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Failed to update intern");
      }

      toast.success("Intern record updated");
      setOpen(false);
      window.location.reload();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">Edit intern record</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit intern data</DialogTitle>
          <DialogDescription>
            Update intern details. Agency cannot be changed.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="agency-name">Agency</Label>
              <InputGroup>
                <InputGroupInput
                  id="agency-name"
                  value={initialAgencyName}
                  disabled
                />
              </InputGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="institution">Institution (optional)</Label>
              <Select
                value={institutionId}
                onValueChange={(value) => {
                  setInstitutionId(value);
                  setError("");
                }}
                disabled={loading || optionsLoading}
              >
                <SelectTrigger id="institution" className="w-full">
                  <SelectValue placeholder="Select institution" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No institution</SelectItem>
                  {institutions.map((institution) => (
                    <SelectItem key={institution.id} value={institution.id}>
                      {institution.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date-range">Intern period</Label>
            <InputGroup>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date-range"
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    {dateRange?.from
                      ? dateRange.to
                        ? `${format(dateRange.from, "dd MMM yyyy")} - ${format(dateRange.to, "dd MMM yyyy")}`
                        : `${format(dateRange.from, "dd MMM yyyy")} - ongoing`
                      : "Select date range"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={(value) => {
                      setDateRange(value);
                      setError("");
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </InputGroup>
          </div>

          {error ? <p className="text-sm text-red-500">{error}</p> : null}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
