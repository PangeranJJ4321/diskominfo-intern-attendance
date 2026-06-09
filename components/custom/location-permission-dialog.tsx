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
import { MapPin } from "lucide-react";
import type { LocationPermissionDialogProps } from "@/interfaces/custom";

export function LocationPermissionDialog({
  open,
  onOpenChange,
  onGranted,
  onDenied,
}: LocationPermissionDialogProps) {
  const [permissionRequested, setPermissionRequested] = useState(false);
  const [error, setError] = useState("");

  const requestLocationPermission = () => {
    setPermissionRequested(true);
    setError("");

    if (!navigator.geolocation) {
      const msg = "Geolocation is not supported by this browser.";
      setError(msg);
      setPermissionRequested(false);
      if (onDenied) {
        onDenied(msg);
      }
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        onGranted(position);
        onOpenChange(false);
        setPermissionRequested(false);
      },
      (err) => {
        let msg = "Failed to request location access.";
        if (err.code === err.PERMISSION_DENIED) {
          msg =
            "Location permission denied. Please enable it in browser settings.";
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = "Location information is unavailable.";
        } else if (err.code === err.TIMEOUT) {
          msg = "The request to get user location timed out.";
        }
        setError(msg);
        setPermissionRequested(false);
        if (onDenied) {
          onDenied(msg);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-md max-h-[90dvh] overflow-y-auto scrollbar-none p-4 sm:p-6">
        <DialogHeader className="flex flex-col items-center text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
            <MapPin className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle>Location Access Required</DialogTitle>
          <DialogDescription className="mt-2 text-sm text-muted-foreground">
            This app needs permission to access your location to verify your
            attendance within the designated area. Click the button below and
            accept the browser permission request.
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
            onClick={requestLocationPermission}
            disabled={permissionRequested}
            className="w-full sm:w-auto"
          >
            {permissionRequested ? "Requesting..." : "Request Location Access"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
