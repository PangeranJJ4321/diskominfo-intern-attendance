"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Camera as CustomCamera } from "@/components/custom/camera";
import faceRecognition, { type FaceObservation } from "@/lib/face-recognition";
import { toast } from "sonner";
import { addFaceDescriptor } from "@/lib/services/users";
import { FaceModelLoadingOverlay } from "@/components/custom/face-model-loading-overlay";
import { type FaceRegisterDialogProps } from "@/interfaces/profile";
import {
  alignmentSteps,
  getFaceObservationFeedback,
} from "@/lib/face-alignment-utils";
import { useProfileStore } from "@/stores/profile-store";

/**
 * Renders the dialog component to capture and register face descriptors for a user.
 * Reads user data from the Zustand profile store.
 *
 * @param {FaceRegisterDialogProps} props - The component props.
 * @param {boolean} [props.openByDefault=false] - Whether the dialog should be open initially.
 * @returns {React.JSX.Element} The rendered dialog and trigger button.
 */
export function FaceRegisterDialog({
  openByDefault = false,
}: FaceRegisterDialogProps) {
  const user = useProfileStore((s) => s.user);
  const updateStoreUser = useProfileStore((s) => s.updateUser);
  const [open, setOpen] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState(
    "Klik 'Minta Akses Kamera' untuk memulai.",
  );
  const [capturedDescriptors, setCapturedDescriptors] = useState<number[][]>(
    [],
  );
  const [captureStepIndex, setCaptureStepIndex] = useState(0);
  const [modelsReady, setModelsReady] = useState(false);
  const [modelsError, setModelsError] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const resetRegistrationState = () => {
    setCapturedDescriptors([]);
    setCaptureStepIndex(0);
    setError("");
    setModelsReady(false);
    setModelsError("");
    setStatus("Klik 'Minta Akses Kamera' untuk memulai.");
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (!nextOpen) {
      setCameraReady(false);
      resetRegistrationState();
    }
  };

  /** Opens the dialog — the Camera component handles its own permission flow internally. */
  const handleTriggerClick = useCallback(() => {
    setError("");
    setOpen(true);
    setStatus(
      `Langkah 1 dari ${alignmentSteps.length}: ${alignmentSteps[0].instruction}`,
    );
  }, []);

  /** Stabilized callback — avoids re-triggering the Camera stream on every parent render. */
  const handleCameraStreamActive = useCallback(() => {
    setCameraReady(true);
    setStatus(
      `Langkah 1 dari ${alignmentSteps.length}: ${alignmentSteps[0].instruction}`,
    );
  }, []);

  /** Stabilized callback — avoids re-triggering the Camera stream on every parent render. */
  const handleCameraStreamError = useCallback((err: Error) => {
    console.error(err);
    setError(err.message);
    setStatus("Gagal mengakses kamera.");
  }, []);

  useEffect(() => {
    if (openByDefault) {
      setTimeout(() => {
        void handleTriggerClick();
      }, 0);
    }
  }, [openByDefault, handleTriggerClick]);

  const processCapture = useCallback(
    async (observation: FaceObservation, stepIndex: number) => {
      if (!user) return;

      setError("");
      setSubmitting(true);

      const currentStep = alignmentSteps[stepIndex];
      if (!currentStep) return;

      setStatus(`Menyimpan kesejajaran ${currentStep.title.toLowerCase()}...`);

      try {
        // Use mock API to register face descriptor
        const updatedUser = await addFaceDescriptor(
          user.id,
          observation.descriptor,
        );

        setCapturedDescriptors((prev) => [...prev, observation.descriptor]);

        const isFinalCapture = stepIndex === alignmentSteps.length - 1;

        if (!isFinalCapture) {
          const nextStepIndex = stepIndex + 1;

          await new Promise((r) => setTimeout(r, 800));

          setCaptureStepIndex(nextStepIndex);
          setStatus(
            `${currentStep.completion} Selanjutnya: ${alignmentSteps[nextStepIndex]?.instruction}`,
          );
          setSubmitting(false);
          return;
        }

        updateStoreUser(updatedUser);
        toast.success("Pendaftaran wajah berhasil diselesaikan");
        setOpen(false);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan yang tidak terduga";
        setError(message);
        setStatus("Pendaftaran wajah gagal.");
        toast.error(message);

        setSubmitting(false);
      }
    },
    [user, updateStoreUser],
  );

  useEffect(() => {
    if (!open || !cameraReady || submitting) return;

    let isActive = true;
    const currentStepIndex = captureStepIndex;
    const currentStep = alignmentSteps[currentStepIndex];

    if (!currentStep) return;

    const runDetection = async () => {
      const videoElement = videoRef.current;
      if (!videoElement) return;

      while (isActive) {
        try {
          const observation =
            await faceRecognition.detectFaceObservationFromInput(videoElement);

          if (!isActive) break;

          if (!observation) {
            setStatus((prev) =>
              prev === "Pastikan hanya satu wajah yang terlihat."
                ? prev
                : "Pastikan hanya satu wajah yang terlihat.",
            );
          } else {
            const feedback = getFaceObservationFeedback(
              observation,
              currentStep.key,
            );

            if (feedback.isAligned) {
              setStatus(feedback.message);
              void processCapture(observation, currentStepIndex);
              break;
            } else {
              setStatus((prev) =>
                prev === feedback.message ? prev : feedback.message,
              );
            }
          }
        } catch (error) {
          console.error("Face detection error:", error);
        }

        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    };

    void runDetection();

    return () => {
      isActive = false;
    };
  }, [open, cameraReady, submitting, captureStepIndex, processCapture]);

  return (
    <>
      <Button variant="outline" onClick={handleTriggerClick}>
        Daftarkan wajah
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90dvh] overflow-y-auto scrollbar-none p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Daftarkan wajah</DialogTitle>
            <DialogDescription>
              Ikuti petunjuk di bawah ini untuk mengambil beberapa pose wajah
              yang sejajar untuk {user?.name ?? "pengguna"}. Proses pengambilan
              foto akan berjalan secara otomatis.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="relative overflow-hidden rounded-xl border bg-black/90 aspect-square sm:aspect-video">
              <FaceModelLoadingOverlay
                visible={open && !modelsReady && !modelsError}
                onReady={() => setModelsReady(true)}
                onError={(err) => {
                  setModelsError(err.message);
                  setStatus("Gagal memuat model.");
                }}
              />

              {modelsReady && (
                <CustomCamera
                  ref={videoRef}
                  open={open}
                  onStreamActive={handleCameraStreamActive}
                  onStreamError={handleCameraStreamError}
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            <div className="rounded-lg border bg-foreground/5 p-3 sm:p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">{status}</p>
              <p className="mt-1 text-xs sm:text-sm">
                Pastikan wajah Anda mendapat pencahayaan yang cukup dan berada
                sendirian di dalam bingkai.
              </p>

              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {alignmentSteps.map((step, index) => {
                  const isCaptured = index < capturedDescriptors.length;
                  const isActive = index === captureStepIndex;

                  return (
                    <div
                      key={step.key}
                      className={`rounded-md border px-2 py-1.5 sm:px-3 sm:py-2 text-xs transition-colors ${
                        isCaptured
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 font-medium"
                          : isActive
                            ? "border-primary/30 bg-primary/10 text-foreground font-medium"
                            : "border-border bg-background text-muted-foreground"
                      }`}
                    >
                      <p className="font-medium leading-tight">{step.title}</p>
                      <p className="mt-0.5 leading-tight opacity-90 text-[10px]">
                        {step.instruction}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {error || modelsError ? (
              <p className="text-sm text-red-500 font-medium">
                {error || modelsError}
              </p>
            ) : null}

            <div className="flex justify-end gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={submitting}
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
