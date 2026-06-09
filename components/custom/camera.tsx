"use client";

import React, {
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useState,
} from "react";
import { cn } from "@/lib/utils";
import { CameraPermissionDialog } from "@/components/custom/camera-permission-dialog";
import type { CameraProps } from "@/interfaces/custom";

/**
 * Komponen Kamera Mandiri.
 *
 * Mengelola sendiri alur permintaan izin kamera melalui
 * {@link CameraPermissionDialog} yang digunakan secara internal.
 * Komponen induk cukup mengatur prop `open` menjadi `true` — tidak perlu
 * mengelola dialog izin kamera secara terpisah.
 *
 * Logika canvas, tracking, looping, dan AI tetap dikerjakan oleh komponen induk.
 */
export const Camera = forwardRef<HTMLVideoElement, CameraProps>(
  (
    {
      open,
      onStreamActive,
      onStreamError,
      facingMode = "user",
      className,
      ...props
    },
    forwardedRef,
  ) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);
    // Track whether the parent was notified of a fatal error (prevents duplicate calls)
    const fatalErrorNotifiedRef = useRef(false);

    // Mengekspos elemen video internal ke parent component melalui ref
    useImperativeHandle(forwardedRef, () => videoRef.current!);

    // Fungsi murni untuk menghentikan hardware kamera secara instan
    const stopCameraTracks = useCallback(() => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }, []);

    /**
     * Attaches a MediaStream to the internal `<video>` element,
     * waits for metadata, and starts playback.
     */
    const attachAndPlayStream = useCallback(
      async (stream: MediaStream) => {
        streamRef.current = stream;
        if (!videoRef.current) return;

        videoRef.current.srcObject = stream;

        await new Promise<void>((resolve, reject) => {
          if (!videoRef.current) return reject();
          videoRef.current.onloadedmetadata = () => resolve();
          videoRef.current.onerror = () =>
            reject(new Error("Gagal memuat metadata video."));
        });

        await videoRef.current.play();

        setPermissionDialogOpen(false);
        fatalErrorNotifiedRef.current = false;

        if (onStreamActive) {
          onStreamActive();
        }
      },
      [onStreamActive],
    );

    /**
     * Requests the camera stream from the browser.
     * On NotAllowedError, opens the CameraPermissionDialog for a retry.
     * On other errors, notifies the parent via onStreamError.
     */
    const requestCameraStream = useCallback(async () => {
      if (!videoRef.current) return;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode },
        });

        await attachAndPlayStream(stream);
      } catch (err) {
        const isNotAllowed =
          err instanceof DOMException &&
          (err.name === "NotAllowedError" ||
            err.name === "PermissionDeniedError");

        if (isNotAllowed) {
          // Buka dialog izin — CameraPermissionDialog akan meminta ulang getUserMedia
          setPermissionDialogOpen(true);
        } else {
          const error =
            err instanceof Error ? err : new Error("Gagal mengakses kamera.");
          console.error("Camera Hardware Error:", error);
          if (onStreamError && !fatalErrorNotifiedRef.current) {
            fatalErrorNotifiedRef.current = true;
            onStreamError(error);
          }
        }
      }
    }, [facingMode, onStreamError, attachAndPlayStream]);

    /** Called when CameraPermissionDialog successfully obtains a stream. */
    const handlePermissionGranted = useCallback(
      (stream: MediaStream) => {
        void attachAndPlayStream(stream);
      },
      [attachAndPlayStream],
    );

    /** Called when CameraPermissionDialog is dismissed without granting. */
    const handlePermissionDenied = useCallback(
      (error: string) => {
        setPermissionDialogOpen(false);
        if (onStreamError && !fatalErrorNotifiedRef.current) {
          fatalErrorNotifiedRef.current = true;
          onStreamError(
            new Error(error || "Akses kamera ditolak oleh pengguna."),
          );
        }
      },
      [onStreamError],
    );

    useEffect(() => {
      let isActive = true;
      let retryTimeout: NodeJS.Timeout;

      // Reset state saat `open` berubah
      fatalErrorNotifiedRef.current = false;
      setPermissionDialogOpen(false);

      // Jika modal ditutup, matikan kamera segera
      if (!open) {
        stopCameraTracks();
        return;
      }

      const startCameraStream = async () => {
        // Polling pengaman jika elemen DOM <video> belum siap karena delay animasi Dialog UI
        if (!videoRef.current) {
          if (isActive) {
            retryTimeout = setTimeout(startCameraStream, 50);
          }
          return;
        }

        if (!isActive) return;

        await requestCameraStream();
      };

      void startCameraStream();

      // Teardown: Memastikan lampu kamera mati saat komponen unmount atau dialog ditutup
      return () => {
        isActive = false;
        clearTimeout(retryTimeout);
        stopCameraTracks();
      };
    }, [open, facingMode, stopCameraTracks, requestCameraStream]);

    return (
      <>
        <CameraPermissionDialog
          open={permissionDialogOpen}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) {
              handlePermissionDenied("Dialog izin kamera ditutup.");
            }
          }}
          onGranted={handlePermissionGranted}
          onDenied={handlePermissionDenied}
        />

        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={cn("w-full object-cover scale-x-[-1] bg-black", className)}
          {...props}
        />
      </>
    );
  },
);

Camera.displayName = "Camera";
