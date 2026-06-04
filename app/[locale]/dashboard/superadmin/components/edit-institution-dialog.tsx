"use client";

import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import { updateInstitutionSchema } from "@/lib/schemas/institution";
import { toast } from "sonner";

interface EditInstitutionDialogProps {
  institutionId: string;
  initialName: string;
  onSuccess?: () => void;
  children?: React.ReactNode;
}

export function EditInstitutionDialog({
  institutionId,
  initialName,
  onSuccess,
  children,
}: EditInstitutionDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(initialName);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate using schema
    const result = updateInstitutionSchema.safeParse({ name });
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      setError(errors.name?.[0] || "Validasi gagal");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/institutes/${institutionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Gagal memperbarui institusi");
      }

      toast.success("Institusi berhasil diperbarui");
      setOpen(false);
      onSuccess?.();
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
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Institusi</DialogTitle>
          <DialogDescription>
            Ubah informasi institusi di bawah
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Nama Institusi</Label>
            <InputGroup>
              <InputGroupInput
                id="edit-name"
                placeholder="Masukkan nama institusi"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError("");
                }}
                disabled={loading}
              />
            </InputGroup>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
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
              {loading ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
