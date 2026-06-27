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
import { Trash2Icon, UploadIcon, CropIcon } from "lucide-react";
import { useFileUpload } from "@/hooks/use-file-upload";
import { uploadImage } from "@/lib/services/upload";
import Cropper from "react-easy-crop";
import getCroppedImg, { type PixelCrop } from "@/lib/crop-image";

/**
 * Renders the edit profile picture dialog.
 *
 * @param {EditProfilePictureDialogProps} props - The component props.
 * @param {string} props.userId - The ID of the user.
 * @param {string | null} props.currentImage - The current profile picture URL.
 * @param {boolean} props.open - Whether the dialog is open.
 * @param {function} props.onOpenChange - Callback called when open state changes.
 * @param {function} props.onSuccess - Callback called on successful save.
 * @returns {React.JSX.Element} The rendered dialog.
 */
export function EditProfilePictureDialog({
  userId,
  currentImage,
  open,
  onOpenChange,
  onSuccess,
}: EditProfilePictureDialogProps) {
  const [loading, setLoading] = useState(false);

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

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<PixelCrop | null>(null);

  const onCropComplete = (croppedArea: any, croppedAreaPixels: PixelCrop) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const uploadedFile = fileState.files[0];
      let newImage: string | null = null;

      if (uploadedFile) {
        if (uploadedFile.file instanceof File) {
          // It's a new upload. We need to crop it!
          if (!croppedAreaPixels) {
            throw new Error("Pilih area foto (crop) terlebih dahulu");
          }
          const croppedFile = await getCroppedImg(
            uploadedFile.preview || "",
            croppedAreaPixels
          );
          
          if (!croppedFile) throw new Error("Gagal memotong gambar");

          const { url } = await uploadImage(croppedFile, "profile-pictures");
          newImage = url;
        } else {
          // Existing file retained
          newImage = uploadedFile.file.url;
        }
      }

      const updatedUser = await updateUser(userId, {
        image: newImage,
      });
      onSuccess(updatedUser);
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
            Unggah foto profil baru. Ukuran yang direkomendasikan adalah 256x256 piksel, maks 2MB.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-4">
          <div
            className={`w-full flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 transition-colors ${fileState.isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/20 hover:border-primary/50"
              }`}
            onDragEnter={fileActions.handleDragEnter}
            onDragLeave={fileActions.handleDragLeave}
            onDragOver={fileActions.handleDragOver}
            onDrop={fileActions.handleDrop}
          >
            {fileState.files.length > 0 ? (
              <div className="relative w-full h-64 sm:h-72 bg-black/5 rounded-xl overflow-hidden group border border-border">
                {fileState.files[0].file instanceof File ? (
                  <Cropper
                    image={fileState.files[0].preview ?? ""}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    cropShape="round"
                    showGrid={false}
                    onCropChange={setCrop}
                    onCropComplete={onCropComplete}
                    onZoomChange={setZoom}
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full relative">
                    <Image
                      src={fileState.files[0].preview ?? ""}
                      alt="Pratinjau profil"
                      width={200}
                      height={200}
                      unoptimized
                      className="h-48 w-48 rounded-full border border-border object-cover"
                    />
                  </div>
                )}
                
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 rounded-full border border-background shadow hover:bg-destructive z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileActions.clearFiles();
                  }}
                  disabled={loading}
                  title="Hapus foto"
                >
                  <Trash2Icon className="h-4 w-4" />
                </Button>
                
                {fileState.files[0].file instanceof File && (
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center bg-background/80 backdrop-blur border border-border rounded-lg px-3 py-1.5 shadow-sm z-10 gap-2">
                    <CropIcon className="h-4 w-4 text-muted-foreground" />
                    <input
                      type="range"
                      value={zoom}
                      min={1}
                      max={3}
                      step={0.1}
                      aria-labelledby="Zoom"
                      onChange={(e) => {
                        setZoom(Number(e.target.value));
                      }}
                      className="w-24 sm:w-32 accent-primary"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div
                className="flex flex-col items-center gap-2 cursor-pointer w-full text-center py-4"
                onClick={fileActions.openFileDialog}
              >
                <div className="h-12 w-12 rounded-full border bg-muted flex items-center justify-center mb-2">
                  <UploadIcon className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">Klik untuk mengunggah atau seret & lepas</p>
                <p className="text-xs text-muted-foreground">PNG, JPG atau WEBP hingga 2MB</p>
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
