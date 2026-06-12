"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { updateUser } from "@/lib/services/users";
import type { EditProfilePictureDialogProps } from "@/interfaces/profile";
import { Trash2Icon, UploadIcon } from "lucide-react";
import { useFileUpload } from "@/hooks/use-file-upload";
import { uploadImage } from "@/lib/services/upload";
import { useProfileStore } from "@/stores/profile-store";

/**
 * Renders the edit profile picture dialog.
 * Reads user data from the Zustand profile store and updates it on save.
 *
 * @param {EditProfilePictureDialogProps} props - The component props.
 * @param {boolean} props.open - Whether the dialog is open.
 * @param {function} props.onOpenChange - Callback called when open state changes.
 * @returns {React.JSX.Element} The rendered dialog.
 */
export function EditProfilePictureDialog({
  open,
  onOpenChange,
}: EditProfilePictureDialogProps) {
  const user = useProfileStore((s) => s.user);
  const updateStoreUser = useProfileStore((s) => s.updateUser);
  const [loading, setLoading] = useState(false);

  const currentImage = user?.image ?? null;

  const [fileState, fileActions] = useFileUpload({
    maxFiles: 1,
    maxSize: 2 * 1024 * 1024,
    accept: "image/*",
    multiple: false,
    initialFiles: currentImage
      ? [
          {
            id: "current-avatar",
            name: "current-avatar",
            size: 0,
            type: "image/*",
            url: currentImage,
          },
        ]
      : [],
  });

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const uploadedFile = fileState.files[0];
      let newImage: string | null = null;

      if (uploadedFile) {
        if (uploadedFile.file instanceof File) {
          // New file uploaded — convert to base64 and upload to Cloudinary
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(uploadedFile.file as File);
          });

          const { url } = await uploadImage(base64, "profile-pictures");
          newImage = url;
        } else {
          // Existing file retained
          newImage = uploadedFile.file.url;
        }
      }

      const updatedUser = await updateUser(user.id, {
        image: newImage,
      });
      updateStoreUser(updatedUser);
      toast.success("Foto profil berhasil diperbarui");
      onOpenChange(false);
    } catch {
      toast.error("Gagal memperbarui foto profil");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90dvh] overflow-y-auto scrollbar-none p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Edit Foto Profil</DialogTitle>
          <DialogDescription>
            Unggah foto profil baru. Ukuran yang direkomendasikan adalah 256x256
            piksel, maks 2MB.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-4">
          <div
            className={`w-full flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 transition-colors ${
              fileState.isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/20 hover:border-primary/50"
            }`}
            onDragEnter={fileActions.handleDragEnter}
            onDragLeave={fileActions.handleDragLeave}
            onDragOver={fileActions.handleDragOver}
            onDrop={fileActions.handleDrop}
          >
            {fileState.files.length > 0 ? (
              <div className="relative group">
                <Image
                  src={fileState.files[0].preview ?? ""}
                  alt="Pratinjau profil"
                  width={128}
                  height={128}
                  unoptimized
                  className="h-32 w-32 rounded-full border border-border object-cover"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute -top-1 -right-1 h-8 w-8 rounded-full border border-background shadow hover:bg-destructive"
                  onClick={() => fileActions.clearFiles()}
                  disabled={loading}
                  title="Hapus foto"
                >
                  <Trash2Icon className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                className="flex flex-col items-center gap-2 cursor-pointer w-full text-center py-4"
                onClick={fileActions.openFileDialog}
              >
                <div className="h-12 w-12 rounded-full border bg-muted flex items-center justify-center mb-2">
                  <UploadIcon className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">
                  Klik untuk mengunggah atau seret & lepas
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG atau WEBP hingga 2MB
                </p>
              </div>
            )}

            <input {...fileActions.getInputProps()} className="hidden" />
          </div>

          {fileState.errors.length > 0 && (
            <p className="text-xs text-red-500 font-medium text-center">
              {fileState.errors.join(", ")}
            </p>
          )}
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
          <Button type="button" onClick={handleSave} loading={loading}>
            Simpan perubahan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
