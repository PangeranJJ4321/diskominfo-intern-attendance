"use client";

import { useEffect, useState } from "react";
import { format, startOfDay, subMonths } from "date-fns";
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
import { InputGroup } from "@/components/ui/input-group";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { createInternSchema } from "@/lib/schemas/intern";
import { toast } from "sonner";

interface InternCreateDialogProps {
  userId: string;
  openByDefault?: boolean;
  onSuccess?: () => void;
}

export function InternCreateDialog({
  userId,
  openByDefault = false,
  onSuccess,
}: InternCreateDialogProps) {
  const [open, setOpen] = useState(!!openByDefault);
  const [loading, setLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(false);

  const [agencyId, setAgencyId] = useState("");
  const [institutionId, setInstitutionId] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const [agencies, setAgencies] = useState<Array<{ id: string; name: string }>>(
    [],
  );
  const [institutions, setInstitutions] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    let isActive = true;

    // Fetch agencies and institutions when the dialog opens with high limits
    (async () => {
      setOptionsLoading(true);

      try {
        const [aRes, iRes] = await Promise.all([
          fetch("/api/agencies?limit=100"),
          fetch("/api/institutes?limit=100"),
        ]);

        if (!isActive) return;

        if (aRes.ok) {
          const aData = await aRes.json();
          setAgencies(Array.isArray(aData.data) ? aData.data : []);
        }
        if (iRes.ok) {
          const iData = await iRes.json();
          setInstitutions(Array.isArray(iData.data) ? iData.data : []);
        }
      } catch {
        // ignore — admin might not have permission yet
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
    const minimumStartedAt = startOfDay(subMonths(new Date(), 1));

    if (!startedAt) {
      setError("Tanggal mulai harus dipilih");
      return;
    }

    if (!finishedAt) {
      setError("Tanggal selesai harus dipilih");
      return;
    }

    if (startedAt < minimumStartedAt) {
      setError("Tanggal mulai maksimal satu bulan ke belakang");
      return;
    }

    if (!agencyId) {
      setError("Agency harus dipilih");
      return;
    }

    if (finishedAt <= new Date()) {
      setError("Tanggal selesai harus setelah waktu saat ini");
      return;
    }

    const institutionForSubmit =
      institutionId === "" || institutionId === "none"
        ? undefined
        : institutionId;

    const parsed = createInternSchema.safeParse({
      userId,
      agencyId,
      institutionId: institutionForSubmit,
      startedAt,
      finishedAt,
    });

    if (!parsed.success) {
      setError(
        Object.values(parsed.error.flatten().fieldErrors).flat()[0] ||
          "Validasi gagal",
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/interns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Gagal membuat intern");
      }

      toast.success("Intern berhasil dibuat");
      setOpen(false);

      if (onSuccess) {
        onSuccess();
        return;
      }

      // reload page to reflect new record
      window.location.reload();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Create intern record</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah data intern</DialogTitle>
          <DialogDescription>
            Buat catatan intern untuk pengguna ini.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="agency">Agency</Label>
              <Select
                value={agencyId}
                onValueChange={(v) => {
                  setAgencyId(v);
                  setError("");
                }}
                disabled={loading || optionsLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih agency" />
                </SelectTrigger>
                <SelectContent>
                  {agencies.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="institution">Institusi (opsional)</Label>
              <Select
                value={institutionId}
                onValueChange={(v) => {
                  setInstitutionId(v);
                  setError("");
                }}
                disabled={loading || optionsLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih institusi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tidak ada</SelectItem>
                  {institutions.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <Label htmlFor="dateRange">Periode intern</Label>
              <InputGroup>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      {dateRange?.from
                        ? dateRange.to
                          ? `${format(dateRange.from, "dd MMM yyyy")} - ${format(dateRange.to, "dd MMM yyyy")}`
                          : `${format(dateRange.from, "dd MMM yyyy")} - pilih tanggal selesai`
                        : "Pilih rentang tanggal"}
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
                      disabled={(date) =>
                        date < startOfDay(subMonths(new Date(), 1))
                      }
                    />
                  </PopoverContent>
                </Popover>
              </InputGroup>
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

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
              {loading ? "Menyimpan..." : "Buat"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default InternCreateDialog;
