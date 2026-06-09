"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Camera } from "lucide-react";
import type { CameraPermissionDialogProps } from "@/interfaces/custom";

export function CameraPermissionDialog({
  open,
  onOpenChange,
  onGranted,
  onDenied,
}: CameraPermissionDialogProps) {
  const [permissionRequested, setPermissionRequested] = useState(false);
  const [error, setError] = useState("");

  const requestCameraPermission = async () => {
    setPermissionRequested(true);
    setError("");

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera is not supported in this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: "user" },
      });

      onGranted(stream);
      onOpenChange(false);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to request camera access.";
      setError(message);
      if (onDenied) {
        onDenied(message);
      }
    } finally {
      setPermissionRequested(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-md max-h-[90dvh] overflow-y-auto scrollbar-none p-4 sm:p-6">
        <DialogHeader className="flex flex-col items-center text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
            <Camera className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle>Camera Access Required</DialogTitle>
          <DialogDescription className="mt-2 text-sm text-muted-foreground">
            This app needs permission to access your camera to register your
            face. Click the button below and accept the browser permission
            request.
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <p className="text-sm font-medium text-red-500 text-center bg-red-50 dark:bg-red-950/20 p-3 rounded-lg mt-2">
            {error}
          </p>
        ) : null}

        <div className="flex justify-end gap-2 mt-4 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={permissionRequested}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={requestCameraPermission}
            disabled={permissionRequested}
            className="w-full sm:w-auto"
          >
            {permissionRequested ? "Requesting..." : "Request Camera Access"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
