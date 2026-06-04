"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import faceRecognition from "@/lib/face-recognition";

type FaceObservation = NonNullable<
  Awaited<ReturnType<typeof faceRecognition.detectFaceObservationFromInput>>
>;

interface FaceRecognitionScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setFaceDescriptor: (faceDescriptor: number[]) => void;
}

export default function FaceRecognitionScanner({
  open,
  onOpenChange,
  setFaceDescriptor,
}: FaceRecognitionScannerProps) {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [permissionRequested, setPermissionRequested] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState(
    "Click 'Request Camera Access' to start scanning.",
  );
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const resetScannerState = useCallback(() => {
    setCameraReady(false);
    setSubmitting(false);
    setError("");
    setStatus("Click 'Request Camera Access' to start scanning.");
  }, []);

  const requestCameraPermission = useCallback(async () => {
    setPermissionRequested(true);
    setError("");
    setStatus("Loading face recognition models...");

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera is not supported in this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: "user" },
      });

      // Permission granted - store the stream
      streamRef.current = stream;
      setPermissionGranted(true);
      setStatus("Look straight at the camera. Capturing descriptor...");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to request camera access.";
      setError(message);
      setStatus(
        "Camera permission denied. Click 'Request Camera Access' to try again.",
      );
      setPermissionRequested(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    const stream = streamRef.current;

    if (stream) {
      for (const track of stream.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }

    const videoElement = videoRef.current;

    if (videoElement) {
      videoElement.srcObject = null;
    }

    setPermissionGranted(false);
    setPermissionRequested(false);
  }, []);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      onOpenChange(nextOpen);

      if (!nextOpen) {
        stopCamera();
        resetScannerState();
      }
    },
    [onOpenChange, resetScannerState, stopCamera],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    let isActive = true;

    const loadModels = async () => {
      try {
        await faceRecognition.loadModels();
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to load face recognition models.";
        if (isActive) {
          setError(message);
          setStatus("Failed to load models. Please try again.");
        }
      }
    };

    void loadModels();

    return () => {
      isActive = false;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !permissionGranted) {
      return;
    }

    let isActive = true;

    const initializeCamera = async () => {
      try {
        const stream = streamRef.current;
        if (!stream) return;

        const videoElement = videoRef.current;
        if (!videoElement) return;

        videoElement.srcObject = stream;

        await new Promise<void>((resolve, reject) => {
          const handleLoadedMetadata = () => {
            videoElement.onloadedmetadata = null;
            resolve();
          };

          const handleError = () => {
            videoElement.onerror = null;
            reject(new Error("Failed to start the camera stream."));
          };

          videoElement.onloadedmetadata = handleLoadedMetadata;
          videoElement.onerror = handleError;
        });

        await videoElement.play();

        if (!isActive) return;

        setCameraReady(true);
        setStatus("Look straight at the camera. Capturing descriptor...");
      } catch (initError) {
        const message =
          initError instanceof Error
            ? initError.message
            : "Failed to initialize camera.";

        if (isActive) {
          setError(message);
          setStatus("Camera initialization failed.");
        }
      }
    };

    void initializeCamera();

    return () => {
      isActive = false;
      stopCamera();
    };
  }, [open, permissionGranted, stopCamera]);

  useEffect(() => {
    if (!open || !cameraReady || submitting) {
      return;
    }

    let isActive = true;

    const processObservation = async (observation: FaceObservation) => {
      setSubmitting(true);
      setError("");
      setStatus("Face detected. Saving descriptor...");

      try {
        // Harus menggunakan Array.from karena tipe data Float32Array
        // yang dikembalikan models tidak bisa stringified by default untuk payload JSON
        setFaceDescriptor(Array.from(observation.descriptor));
        handleOpenChange(false);
      } catch (saveError) {
        const message =
          saveError instanceof Error
            ? saveError.message
            : "Failed to save face descriptor.";

        if (isActive) {
          setError(message);
          setStatus("Face descriptor capture failed.");
          toast.error(message);
          setSubmitting(false);
        }
      }
    };

    const runDetection = async () => {
      const videoElement = videoRef.current;

      if (!videoElement) {
        return;
      }

      while (isActive) {
        try {
          const observation =
            await faceRecognition.detectFaceObservationFromInput(videoElement);

          if (!isActive) break;

          if (!observation) {
            setStatus("Make sure exactly one face is visible.");
          } else {
            await processObservation(observation);
            break;
          }
        } catch (detectionError) {
          console.error("Face detection error:", detectionError);
        }

        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    };

    void runDetection();

    return () => {
      isActive = false;
    };
  }, [cameraReady, handleOpenChange, open, setFaceDescriptor, submitting]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[95vw] max-h-[90dvh] overflow-y-auto p-4 sm:max-w-2xl sm:p-6">
        <DialogHeader>
          <DialogTitle>Face recognition scanner</DialogTitle>
          <DialogDescription>
            Position your face in front of the camera. The scanner will detect a
            single face and return its descriptor automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {!permissionGranted ? (
            <>
              <div className="rounded-lg border bg-foreground/5 p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">
                  Camera Access Required
                </p>
                <p className="mt-2">
                  This app needs permission to access your camera to scan faces.
                  Click the button below and accept the browser permission
                  request.
                </p>
              </div>

              {error ? (
                <p className="text-sm font-medium text-red-500">{error}</p>
              ) : null}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={permissionRequested}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={requestCameraPermission}
                  disabled={permissionRequested}
                >
                  {permissionRequested
                    ? "Requesting..."
                    : "Request Camera Access"}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <div className="overflow-hidden rounded-xl border bg-black/90">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="aspect-square w-full scale-x-[-1] object-cover sm:aspect-video"
                />
              </div>

              <div className="rounded-lg border bg-foreground/5 p-3 text-sm text-muted-foreground sm:p-4">
                <p className="font-medium text-foreground">{status}</p>
                <p className="mt-1 text-xs sm:text-sm">
                  Keep your face well-lit and alone in the frame.
                </p>
              </div>

              {error ? (
                <p className="text-sm font-medium text-red-500">{error}</p>
              ) : null}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </DialogFooter>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
