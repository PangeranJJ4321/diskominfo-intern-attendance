"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RotateCcw, AlertTriangle } from "lucide-react";
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

interface FaceResetButtonProps {
  userId: string;
}

export default function FaceResetButton({ userId }: FaceResetButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleResetFaceData = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/users/${userId}/face-descriptors`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Gagal menghapus data wajah");
      }

      toast.success("Data wajah berhasil direset. Mahasiswa Intern kini dapat mendaftar ulang.");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan sistem");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="w-full text-xs font-semibold h-9 rounded-lg border-amber-500/30 text-amber-600 hover:bg-amber-500/10 hover:text-amber-700">
          <RotateCcw className="size-3.5 mr-1.5" />
          Reset Data Wajah
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-5" />
            Konfirmasi Reset Wajah
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm font-medium mt-2 text-foreground/80">
            Tindakan ini akan menghapus semua data biometrik wajah mahasiswa intern ini dari sistem. Mahasiswa Intern harus mendaftarkan ulang wajahnya sebelum bisa melakukan absensi kembali.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4 gap-2 sm:gap-0">
          <AlertDialogCancel className="h-9 text-xs rounded-lg font-semibold">Batal</AlertDialogCancel>
          <Button 
            variant="destructive" 
            onClick={handleResetFaceData} 
            disabled={isDeleting}
            className="h-9 text-xs rounded-lg font-semibold min-w-[100px]"
          >
            {isDeleting ? <Spinner className="size-4" /> : "Ya, Hapus Data"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
