"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera as CustomCamera } from "@/components/custom/camera";
import { toast } from "sonner";
import { Camera as CameraIcon, ShieldCheck, AlertCircle } from "lucide-react"; // Rename icon menghindari bentrok nama
import { cn } from "@/lib/utils";
import faceRecognition from "@/lib/face-recognition";
import { type TakeAttendanceFaceCameraProps } from "@/interfaces/dashboard";
import { uploadImage } from "@/lib/services/upload";
import { useFileUpload } from "@/hooks/use-file-upload";
import { Spinner } from "@/components/ui/spinner";
import { FaceModelLoadingOverlay } from "@/components/custom/face-model-loading-overlay";
import { useFaceCaptureStore } from "@/stores/useFaceCaptureStore";

/**
 * Camera component for verifying the user's face during check-in.
 */
export default function TakeAttendanceFaceCamera({
  open,
  onOpenChange,
}: TakeAttendanceFaceCameraProps) {
  const [cameraReady, setCameraReady] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("Menunggu akses kamera...");
  const [fileState, fileActions] = useFileUpload({
    maxFiles: 1,
    maxSize: 2 * 1024 * 1024,
    accept: "image/*",
    multiple: false,
  });
  const [capturedDescriptor, setCapturedDescriptor] = useState<number[] | null>(
    null,
  );
  const [modelsReady, setModelsReady] = useState(false);
  const setCapture = useFaceCaptureStore((s) => s.setCapture);

  const [modelsError, setModelsError] = useState("");

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Stabilized state reset
  const resetState = useCallback(() => {
    setError("");
    setVerifying(false);
    setStatus("Menunggu akses kamera...");
    fileActions.clearFiles();
    setCapturedDescriptor(null);
    setCameraReady(false);
    setModelsReady(false);
    setModelsError("");
  }, [fileActions]);

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      resetState();
    }
  };

  // Amankan siklus penutupan eksternal: Reset state dengan aman tanpa cascading render
  useEffect(() => {
    if (!open) {
      const deferTimeout = setTimeout(() => {
        resetState();
      }, 0);
      return () => clearTimeout(deferTimeout);
    }
  }, [open, resetState]);

  /** Stabilized callback — avoids re-triggering the Camera stream on every parent render. */
  const handleCameraStreamActive = useCallback(() => {
    setCameraReady(true);
    setStatus("Posisikan wajah Anda pada kamera dan klik Ambil Foto.");
  }, []);

  /** Stabilized callback — avoids re-triggering the Camera stream on every parent render. */
  const handleCameraStreamError = useCallback((err: Error) => {
    console.error(err);
    setError(err.message);
    setStatus("Gagal mengakses kamera.");
  }, []);

  const capturePhoto = async () => {
    const video = videoRef.current;
    if (!video) return;

    setVerifying(true);
    setError("");
    setStatus("Mendeteksi wajah...");

    try {
      const descriptor = await faceRecognition.detectDescriptorFromInput(video);

      if (!descriptor) {
        setError(
          "Wajah tidak terdeteksi. Silakan posisikan wajah Anda tepat di depan kamera.",
        );
        setStatus("Deteksi gagal.");
        setVerifying(false);
        return;
      }

      const MAX_DIMENSION = 640;
      let width = video.videoWidth || 640;
      let height = video.videoHeight || 480;

      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }

      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], "attendance.jpg", { type: "image/jpeg" });

      fileActions.addFiles([file]);
      setCapturedDescriptor(descriptor);
      setStatus(
        "Foto terambil dan wajah terdeteksi. Silakan lakukan verifikasi.",
      );

      setCameraReady(false);
    } catch (error) {
      setError("Gagal mendeteksi wajah.");
      console.error(error);
    } finally {
      setVerifying(false);
    }
  };

  const handleRetake = () => {
    fileActions.clearFiles();
    setCapturedDescriptor(null);
    setError("");
    setStatus("Menunggu akses kamera...");
  };

  const handleUploadAndVerify = async () => {
    const uploadedFile = fileState.files[0];
    if (!uploadedFile || !capturedDescriptor) return;

    setVerifying(true);
    setError("");
    setStatus("Mengunggah foto ke server...");

    try {
      let photoUrl = "";
      if (uploadedFile.file instanceof File) {
        const result = await uploadImage(uploadedFile.file, "attendance-photos");
        photoUrl = result.url;
      } else {
        photoUrl = uploadedFile.file.url;
      }

      setStatus("Foto berhasil diunggah! Mencatat presensi...");
      setCapture(photoUrl, capturedDescriptor);
      handleOpenChange(false);
    } catch (error) {
      const errMsg =
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat mengunggah foto.";
      setError(errMsg);
      setStatus("Pengunggahan gagal.");
      toast.error(errMsg);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="w-[95vw] sm:max-w-md max-h-[90dvh] overflow-y-auto scrollbar-none p-4 sm:p-6">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <CameraIcon className="size-5 text-primary" />
              Verifikasi Wajah
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Silakan ambil foto wajah Anda untuk memverifikasi identitas Anda
              di server sebelum mengisi presensi.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-black/90 w-full mx-auto flex items-center justify-center aspect-video">
              <FaceModelLoadingOverlay
                visible={open && !modelsReady && !modelsError}
                onReady={() => setModelsReady(true)}
                onError={(err) => {
                  setModelsError(err.message);
                  setStatus("Gagal memuat model.");
                }}
              />

              {fileState.files[0] ? (
                <Image
                  src={fileState.files[0].preview ?? ""}
                  alt="Captured face snapshot"
                  fill
                  sizes="(max-width: 640px) calc(95vw - 2rem), 26rem"
                  unoptimized
                  className="w-full h-full object-cover"
                />
              ) : (
                <CustomCamera
                  ref={videoRef}
                  open={open}
                  onStreamActive={handleCameraStreamActive}
                  onStreamError={handleCameraStreamError}
                  className={cn(
                    "w-full h-full object-cover",
                    !cameraReady && "hidden",
                  )}
                />
              )}

              {!cameraReady && !fileState.files[0] && modelsReady && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 space-y-3 bg-black/90">
                  <Spinner className="size-8 text-accent" />
                  <p className="text-xs text-muted-foreground font-medium">
                    Memulai kamera...
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-xl border bg-muted/20 p-3.5 text-xs text-muted-foreground flex items-start gap-2.5">
              {verifying ? (
                <ShieldCheck className="size-5 text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="size-5 text-primary shrink-0 mt-0.5" />
              )}
              <div className="space-y-0.5">
                <p className="font-semibold text-foreground">{status}</p>
                <p className="text-[10px] leading-relaxed">
                  Posisikan wajah Anda pada pencahayaan yang cukup dan lepaskan
                  kacamata atau masker jika perlu.
                </p>
              </div>
            </div>

            {(error || fileState.errors.length > 0) && (
              <p className="text-xs font-semibold text-destructive text-center bg-destructive/5 border border-destructive/10 rounded-xl p-3 leading-relaxed">
                {error || fileState.errors.join(", ")}
              </p>
            )}

            <div className="flex flex-col gap-2">
              {!fileState.files[0] ? (
                <Button
                  type="button"
                  disabled={!cameraReady || verifying}
                  loading={verifying}
                  onClick={capturePhoto}
                  className="w-full rounded-xl text-xs h-10 font-bold flex items-center justify-center gap-2"
                >
                  <CameraIcon className="size-4" />
                  Ambil Foto
                </Button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={verifying}
                    onClick={handleRetake}
                    className="rounded-xl text-xs h-10 font-bold"
                  >
                    Foto Ulang
                  </Button>
                  <Button
                    type="button"
                    disabled={verifying}
                    onClick={handleUploadAndVerify}
                    className="rounded-xl text-xs h-10 font-bold flex items-center justify-center gap-2"
                  >
                    {verifying ? (
                      <>
                        <Spinner className="size-4" />
                        Memverifikasi...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="size-4" />
                        Kirim Presensi
                      </>
                    )}
                  </Button>
                </div>
              )}

              <Button
                type="button"
                variant="ghost"
                onClick={() => handleOpenChange(false)}
                disabled={verifying}
                className="rounded-xl text-xs h-9 font-semibold text-muted-foreground hover:text-foreground"
              >
                Batal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
