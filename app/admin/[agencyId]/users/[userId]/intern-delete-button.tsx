"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserMinus, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/spinner";

interface InternDeleteButtonProps {
  internId: string;
  agencyId: string;
  children?: React.ReactNode;
  onSuccess?: () => void;
}

export default function InternDeleteButton({ internId, agencyId, children, onSuccess }: InternDeleteButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/interns/${internId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Gagal menghapus profil mahasiswa intern");
      }

      toast.success("Mahasiswa Intern berhasil dihapus dari instansi.");
      
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/admin/${agencyId}/users`);
      }
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan sistem");
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {children || (
          <Button variant="outline" className="w-full text-xs font-semibold h-9 rounded-lg border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive">
            <UserMinus className="size-3.5 mr-1.5" />
            Hapus Mahasiswa Intern
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-5" />
            Hapus Mahasiswa Intern dari Instansi
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm font-medium mt-2 text-foreground/80">
            Tindakan ini akan menghapus permanen profil mahasiswa intern ini dari instansi Anda, termasuk semua riwayat presensi dan shift yang terhubung dengannya. Tindakan ini tidak dapat dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4 gap-2 sm:gap-0">
          <AlertDialogCancel className="h-9 text-xs rounded-lg font-semibold" disabled={isDeleting}>Batal</AlertDialogCancel>
          <Button 
            variant="destructive" 
            onClick={handleDelete} 
            disabled={isDeleting}
            className="h-9 text-xs rounded-lg font-semibold min-w-[100px]"
          >
            {isDeleting ? <Spinner className="size-4" /> : "Ya, Hapus Permanen"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
