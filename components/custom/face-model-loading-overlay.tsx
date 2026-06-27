"use client";

import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import faceRecognition from "@/lib/face-recognition";
import type { FaceModelLoadingOverlayProps } from "@/interfaces/custom";

/**
 * Renders a semi-transparent overlay with a spinner and progress text
 * while face-api.js models are being loaded from the local server.
 *
 * The overlay automatically dismisses itself when models are ready.
 */
export function FaceModelLoadingOverlay({
  visible,
  onReady,
  onError,
}: FaceModelLoadingOverlayProps) {
  const [statusText, setStatusText] = useState("Mempersiapkan model...");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!visible) return;

    let cancelled = false;

    const start = async () => {
      try {
        await faceRecognition.loadModels((text, prog) => {
          if (!cancelled) {
            setStatusText(text);
            setProgress(prog);
          }
        });
        if (!cancelled) onReady();
      } catch (err) {
        if (!cancelled) {
          onError(
            err instanceof Error
              ? err
              : new Error("Gagal memuat model pengenalan wajah."),
          );
        }
      }
    };

    void start();

    return () => {
      cancelled = true;
    };
  }, [visible, onReady, onError]);

  if (!visible) return null;

  return (
    <div
      className={cn(
        "absolute inset-0 z-20 flex flex-col items-center justify-center gap-3",
        "bg-black/80 backdrop-blur-sm rounded-2xl",
      )}
      aria-live="polite"
      aria-busy={progress < 100}
    >
      <Spinner className="size-10 text-primary" />
      <div className="flex flex-col items-center gap-1 px-4 text-center">
        <p className="text-sm font-semibold text-white">{statusText}</p>
        <div className="w-48 h-1.5 bg-secondary rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
