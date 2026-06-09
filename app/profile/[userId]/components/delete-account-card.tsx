"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteAccountDialog } from "./confirm-delete-account-dialog";
import { Trash2 } from "lucide-react";

import type { DeleteAccountCardProps } from "@/interfaces/profile";


export function DeleteAccountCard({ userId }: DeleteAccountCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <Card className="border-destructive/50 bg-destructive/5 dark:bg-destructive/10">
      <CardHeader>
        <CardTitle className="text-destructive">Zona bahaya</CardTitle>
        <CardDescription>
          Hapus akun Anda dan semua data terkait secara permanen.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">Hapus akun ini</p>
            <p className="text-xs text-muted-foreground">
              Setelah Anda menghapus akun Anda, tindakan ini tidak dapat dibatalkan. Semua deskriptor wajah, log, dan presensi akan dihapus.
            </p>
          </div>
          <Button
            variant="destructive"
            onClick={() => setDialogOpen(true)}
            className="shrink-0 gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Hapus akun
          </Button>
        </div>

        <ConfirmDeleteAccountDialog
          userId={userId}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      </CardContent>
    </Card>
  );
}
