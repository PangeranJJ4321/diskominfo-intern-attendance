"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { deleteUser } from "@/lib/services/users";
import type { ConfirmDeleteAccountDialogProps } from "@/interfaces/profile";


export function ConfirmDeleteAccountDialog({
  userId,
  open,
  onOpenChange,
}: ConfirmDeleteAccountDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const handleDelete = async () => {
    if (confirmText !== "HAPUS") {
      toast.error("Silakan ketik HAPUS untuk mengonfirmasi");
      return;
    }

    setLoading(true);
    try {
      await deleteUser(userId);
      toast.success("Akun berhasil dihapus");
      onOpenChange(false);
      // Redirect to landing or sign-in page
      router.push("/auth/sign-in");
    } catch {
      toast.error("Gagal menghapus akun");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90dvh] overflow-y-auto scrollbar-none p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-destructive">Apakah Anda benar-benar yakin?</DialogTitle>
          <DialogDescription>
            Tindakan ini tidak dapat dibatalkan. Ini akan menghapus akun Anda secara permanen dan menghapus data Anda dari server kami.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="confirm" className="text-sm font-medium">
              Silakan ketik <span className="font-semibold text-foreground">HAPUS</span> untuk mengonfirmasi:
            </Label>
            <Input
              id="confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="HAPUS"
              disabled={loading}
              className="border-destructive/30 focus-visible:ring-destructive"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            loading={loading}
            disabled={confirmText !== "HAPUS"}
          >
            Hapus secara permanen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
