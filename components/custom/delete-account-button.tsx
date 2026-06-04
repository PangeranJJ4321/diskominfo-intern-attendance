"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { authClient } from "@/lib/auth-client";

const CONFIRMATION_WORD = "DELETE";

export default function DeleteAccountButton({ userId }: { userId: string }) {
  const router = useRouter();
  const t = useTranslations();

  const [open, setOpen] = useState<boolean>(false);
  const [confirmInput, setConfirmInput] = useState<string>("");
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const isConfirmed = confirmInput === CONFIRMATION_WORD;

  const handleDelete = async () => {
    if (!isConfirmed || isDeleting) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        toast.error(data.error ?? t("Pages.profile.deleteFailed"));
        return;
      }

      toast.success(t("Pages.profile.deleteSuccess"));
      setOpen(false);
      await authClient.signOut();
      router.push("/");
      router.refresh();
    } catch {
      toast.error(t("Pages.profile.deleteFailed"));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) setConfirmInput("");
    setOpen(next);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          className="w-full"
          data-testid="btn-delete-account"
        >
          <Trash2 className="size-4 mr-2" />
          {t("Pages.profile.deleteAccount")}
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("Pages.profile.deleteAccountDialogTitle")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("Pages.profile.deleteAccountDialogDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="my-2 flex flex-col gap-2">
          <Label htmlFor="confirm-delete" className="text-sm font-medium">
            {t("Pages.profile.deleteAccountConfirmLabel")}
          </Label>
          <Input
            id="confirm-delete"
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.target.value)}
            placeholder={CONFIRMATION_WORD}
            autoComplete="off"
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            {t("common.cancel")}
          </AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={!isConfirmed || isDeleting}
            onClick={handleDelete}
            data-testid="btn-confirm-delete-account"
          >
            {isDeleting && <Spinner className="mr-2" />}
            {t("Pages.profile.deleteAccountConfirmButton")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
