"use client";

import { useEffect, useMemo, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { type ModelLoadingCallback } from "@/lib/face-recognition";
import faceRecognition from "@/lib/face-recognition";
import type { FaceModelLoadingOverlayProps } from "@/interfaces/custom";

/**
 * Renders a semi-transparent overlay with a spinner and progress text
 * while face-api.js models are being downloaded from Cloudinary and cached
 * in IndexedDB.
 *
 * The overlay automatically dismisses itself when models are ready.
 */
export function FaceModelLoadingOverlay({
  visible,
  onReady,
  onError,
}: FaceModelLoadingOverlayProps) {
  const [phase, setPhase] = useState<
    "checking" | "downloading" | "loading" | "done"
  >("checking");
  const [downloaded, setDownloaded] = useState(0);
  const [total, setTotal] = useState(0);

  const onProgress = useMemo<ModelLoadingCallback>(() => {
    return (p, loaded, tot) => {
      setPhase(p);
      if (p === "downloading") {
        setDownloaded(loaded ?? 0);
        setTotal(tot ?? 0);
      }
    };
  }, []);

  useEffect(() => {
    if (!visible) return;

    let cancelled = false;

    const start = async () => {
      try {
        await faceRecognition.loadModels(
          faceRecognition.DEFAULT_MODEL_PATH,
          onProgress,
        );
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
  }, [visible, onReady, onError, onProgress]);

  if (!visible) return null;

  const statusText = (() => {
    switch (phase) {
      case "checking":
        return "Memeriksa model yang tersimpan...";
      case "downloading":
        return `Mengunduh model pengenalan wajah... (${downloaded} dari ${total})`;
      case "loading":
        return "Memuat model ke memori...";
      case "done":
        return "Model siap digunakan.";
      default:
        return "Mempersiapkan model...";
    }
  })();

  return (
    <div
      className={cn(
        "absolute inset-0 z-20 flex flex-col items-center justify-center gap-3",
        "bg-black/80 backdrop-blur-sm rounded-2xl",
      )}
      aria-live="polite"
      aria-busy={phase !== "done"}
    >
      <Spinner className="size-10 text-primary" />
      <div className="flex flex-col items-center gap-1 px-4 text-center">
        <p className="text-sm font-semibold text-white">{statusText}</p>
      </div>
    </div>
  );
}
