"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import faceRecognition from "@/lib/face-recognition";
import { toast } from "sonner";

type AlignmentStepKey = "center" | "left" | "right" | "up" | "down";

type FacePoint = {
  x: number;
  y: number;
};

type FaceObservation = NonNullable<
  Awaited<ReturnType<typeof faceRecognition.detectFaceObservationFromInput>>
>;

interface AlignmentStep {
  key: AlignmentStepKey;
  title: string;
  instruction: string;
  completion: string;
}

const alignmentSteps: AlignmentStep[] = [
  {
    key: "center",
    title: "Center",
    instruction: "Look straight at the camera.",
    completion: "Center pose captured.",
  },
  {
    key: "left",
    title: "Left",
    instruction: "Turn your head slightly to your left.",
    completion: "Left pose captured.",
  },
  {
    key: "right",
    title: "Right",
    instruction: "Turn your head slightly to your right.",
    completion: "Right pose captured.",
  },
  {
    key: "up",
    title: "Up",
    instruction: "Tilt your chin slightly up.",
    completion: "Upward pose captured.",
  },
  {
    key: "down",
    title: "Down",
    instruction: "Tilt your chin slightly down.",
    completion: "Downward pose captured.",
  },
];

function getPointCenter(points: FacePoint[]): FacePoint {
  const totalPoints = points.length;

  if (totalPoints === 0) {
    return { x: 0, y: 0 };
  }

  return points.reduce(
    (accumulator, point) => ({
      x: accumulator.x + point.x / totalPoints,
      y: accumulator.y + point.y / totalPoints,
    }),
    { x: 0, y: 0 },
  );
}

function getFaceObservationFeedback(
  observation: FaceObservation,
  stepKey: AlignmentStepKey,
): { isAligned: boolean; message: string } {
  const leftEyeCenter = getPointCenter(observation.landmarks.leftEye);
  const rightEyeCenter = getPointCenter(observation.landmarks.rightEye);
  const noseCenter = getPointCenter(observation.landmarks.nose);
  const faceCenterX = observation.box.x + observation.box.width / 2;
  const faceCenterY = observation.box.y + observation.box.height / 2;
  const normalizedXOffset =
    (noseCenter.x - faceCenterX) / Math.max(observation.box.width, 1);
  const normalizedYOffset =
    (noseCenter.y - faceCenterY) / Math.max(observation.box.height, 1);
  const eyeTilt =
    Math.abs(leftEyeCenter.y - rightEyeCenter.y) /
    Math.max(Math.abs(leftEyeCenter.x - rightEyeCenter.x), 1);

  if (stepKey === "center") {
    const isAligned =
      Math.abs(normalizedXOffset) <= 0.08 &&
      Math.abs(normalizedYOffset) <= 0.1 &&
      eyeTilt <= 0.08;

    return {
      isAligned,
      message: isAligned
        ? "Center aligned. Capturing..."
        : "Keep your face centered, level, and straight toward the camera.",
    };
  }

  if (stepKey === "left") {
    const isAligned =
      normalizedXOffset >= 0.04 && Math.abs(normalizedYOffset) <= 0.12;

    return {
      isAligned,
      message: isAligned
        ? "Left alignment looks good. Capturing..."
        : "Turn your head a little more to your left.",
    };
  }

  if (stepKey === "right") {
    const isAligned =
      normalizedXOffset <= -0.04 && Math.abs(normalizedYOffset) <= 0.12;

    return {
      isAligned,
      message: isAligned
        ? "Right alignment looks good. Capturing..."
        : "Turn your head a little more to your right.",
    };
  }

  if (stepKey === "up") {
    const isAligned = normalizedYOffset <= -0.04;

    return {
      isAligned,
      message: isAligned
        ? "Upward alignment looks good. Capturing..."
        : "Tilt your chin slightly upward.",
    };
  }

  const isAligned = normalizedYOffset >= 0.04;

  return {
    isAligned,
    message: isAligned
      ? "Downward alignment looks good. Capturing..."
      : "Tilt your chin slightly downward.",
  };
}

interface FaceRegistrationDialogProps {
  userId: string;
  userName: string;
  openByDefault?: boolean;
}

export function FaceRegistrationDialog({
  userId,
  userName,
  openByDefault = false,
}: FaceRegistrationDialogProps) {
  const [open, setOpen] = useState(openByDefault);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [permissionRequested, setPermissionRequested] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState(
    "Click 'Request Camera Access' to start.",
  );
  const [capturedDescriptors, setCapturedDescriptors] = useState<number[][]>(
    [],
  );
  const [captureStepIndex, setCaptureStepIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const resetRegistrationState = () => {
    setCapturedDescriptors([]);
    setCaptureStepIndex(0);
    setError("");
    setStatus("Click 'Request Camera Access' to start.");
  };

  const requestCameraPermission = async () => {
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
      setStatus(
        `Step 1 of ${alignmentSteps.length}: ${alignmentSteps[0].instruction}`,
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to request camera access.";
      setError(message);
      setStatus(
        "Camera permission denied. Click 'Request Camera Access' to try again.",
      );
      setPermissionRequested(false);
    }
  };

  const resetCameraState = () => {
    setCameraReady(false);
    setPermissionGranted(false);
    setPermissionRequested(false);
    resetRegistrationState();

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
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (!nextOpen) {
      resetCameraState();
    }
  };

  useEffect(() => {
    if (!open) return;

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
    if (!open || !permissionGranted) return;

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
        setStatus(
          `Step 1 of ${alignmentSteps.length}: ${alignmentSteps[0].instruction}`,
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to initialize camera.";
        if (isActive) {
          setError(message);
          setStatus("Camera initialization failed.");
        }
      }
    };

    void initializeCamera();

    return () => {
      isActive = false;
    };
  }, [open, permissionGranted]);

  const processCapture = async (
    observation: FaceObservation,
    stepIndex: number,
  ) => {
    setError("");
    setSubmitting(true);

    const currentStep = alignmentSteps[stepIndex];
    if (!currentStep) return;

    setStatus(`Saving ${currentStep.title.toLowerCase()} alignment...`);

    try {
      const response = await fetch("/api/face-descriptors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, descriptor: observation.descriptor }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Failed to register face descriptor");
      }

      setCapturedDescriptors((prev) => [...prev, observation.descriptor]);

      const isFinalCapture = stepIndex === alignmentSteps.length - 1;

      if (!isFinalCapture) {
        const nextStepIndex = stepIndex + 1;

        await new Promise((r) => setTimeout(r, 800));

        setCaptureStepIndex(nextStepIndex);
        setStatus(
          `${currentStep.completion} Next: ${alignmentSteps[nextStepIndex]?.instruction}`,
        );
        setSubmitting(false);
        return;
      }

      toast.success("Face registration completed");
      setOpen(false);
      window.location.reload();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(message);
      setStatus("Face registration failed.");
      toast.error(message);

      setSubmitting(false);
    }
  };

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
              prev === "Make sure exactly one face is visible."
                ? prev
                : "Make sure exactly one face is visible.",
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
        } catch (err) {
          console.error("Face detection error:", err);
        }

        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    };

    void runDetection();

    return () => {
      isActive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, cameraReady, submitting, captureStepIndex]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">Register face</Button>
      </DialogTrigger>
      {/* 
        Responsive Dialog Constraints:
        - w-[95vw]: leaves a small margin on mobile
        - max-h-[90dvh]: dynamic viewport height prevents bottom buttons from hiding behind mobile browsers
        - overflow-y-auto: enables internal scrolling if content spills
      */}
      <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90dvh] overflow-y-auto scrollbar-none p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Register face</DialogTitle>
          <DialogDescription>
            Follow the instructions below to capture several aligned face states
            for {userName}. The process will capture automatically.
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
                  This app needs permission to access your camera to register
                  your face. Click the button below and accept the browser
                  permission request.
                </p>
              </div>

              {error ? (
                <p className="text-sm font-medium text-red-500">{error}</p>
              ) : null}

              <div className="flex justify-end gap-2 shrink-0">
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
              </div>
            </>
          ) : (
            <>
              <div className="overflow-hidden rounded-xl border bg-black/90">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  // Aspect-square prevents aggressive vertical cropping on mobile portrait mode.
                  // Widens to aspect-video on sm+ screens.
                  className="w-full aspect-square sm:aspect-video object-cover scale-x-[-1]"
                />
              </div>

              <div className="rounded-lg border bg-foreground/5 p-3 sm:p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">{status}</p>
                <p className="mt-1 text-xs sm:text-sm">
                  Keep your face well-lit and alone in the frame.
                </p>

                {/* Grid Layout: Stacks neatly into 2 columns on mobile, 3 on larger screens */}
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {alignmentSteps.map((step, index) => {
                    const isCaptured = index < capturedDescriptors.length;
                    const isActive = index === captureStepIndex;

                    return (
                      <div
                        key={step.key}
                        className={`rounded-md border px-2 py-1.5 sm:px-3 sm:py-2 text-xs transition-colors ${
                          isCaptured
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
                            : isActive
                              ? "border-primary/30 bg-primary/10 text-foreground"
                              : "border-border bg-background text-muted-foreground"
                        }`}
                      >
                        <p className="font-medium leading-tight">
                          {step.title}
                        </p>
                        <p className="mt-0.5 leading-tight opacity-90">
                          {step.instruction}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {error ? (
                <p className="text-sm text-red-500 font-medium">{error}</p>
              ) : null}

              <div className="flex justify-end gap-2 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default FaceRegistrationDialog;
