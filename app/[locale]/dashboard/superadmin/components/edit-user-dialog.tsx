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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateUserSchema } from "@/lib/schemas/user";
import { Role } from "@/lib/generated/prisma/enums";
import { toast } from "sonner";

interface EditUserDialogProps {
  userId: string;
  initialName: string;
  initialEmail: string;
  initialRole?: (typeof Role)[keyof typeof Role];
  onSuccess?: () => void;
  children?: React.ReactNode;
}

export function EditUserDialog({
  userId,
  initialName,
  initialEmail,
  initialRole = Role.INTERN,
  onSuccess,
  children,
}: EditUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [role, setRole] =
    useState<(typeof Role)[keyof typeof Role]>(initialRole);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate using schema
    const result = updateUserSchema.safeParse({ name, email, role });
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      const errorMap: Record<string, string> = {};
      if (fieldErrors.name) errorMap.name = fieldErrors.name[0];
      if (fieldErrors.email) errorMap.email = fieldErrors.email[0];
      if (fieldErrors.role) errorMap.role = fieldErrors.role[0];
      setErrors(errorMap);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, role }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Gagal memperbarui pengguna");
      }

      toast.success("Pengguna berhasil diperbarui");
      setOpen(false);
      onSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan";
      toast.error(message);
      setErrors({ submit: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Pengguna</DialogTitle>
          <DialogDescription>
            Ubah informasi pengguna di bawah
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Nama</Label>
            <InputGroup>
              <InputGroupInput
                id="edit-name"
                placeholder="Masukkan nama pengguna"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setErrors((prev) => ({ ...prev, name: "" }));
                }}
                disabled={loading}
              />
            </InputGroup>
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-email">Email</Label>
            <InputGroup>
              <InputGroupInput
                id="edit-email"
                type="email"
                placeholder="Masukkan email pengguna"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors((prev) => ({ ...prev, email: "" }));
                }}
                disabled={loading}
              />
            </InputGroup>
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-role">Peran</Label>
            <Select
              value={role}
              onValueChange={(value) => {
                setRole(value as (typeof Role)[keyof typeof Role]);
                setErrors((prev) => ({ ...prev, role: "" }));
              }}
              disabled={loading}
            >
              <SelectTrigger id="edit-role" className="w-full">
                <SelectValue placeholder="Pilih peran" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={Role.INTERN}>Intern</SelectItem>
                <SelectItem value={Role.ADMIN}>Admin</SelectItem>
                <SelectItem value={Role.SUPERADMIN}>Super Admin</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-red-500">{errors.role}</p>
            )}
          </div>
          {errors.submit && (
            <p className="text-sm text-red-500">{errors.submit}</p>
          )}
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
