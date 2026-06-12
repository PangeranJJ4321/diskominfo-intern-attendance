"use client";

import { useEffect } from "react";

/**
 * Registers the service worker for push notification support on mount.
 * Wraps the app's children so registration happens once the DOM is ready.
 *
 * @param {{ children: React.ReactNode }} props
 * @returns {React.JSX.Element} The children unchanged.
 */
export function PwaProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        })
        .catch((err) => {
          console.error("Service worker registration failed:", err);
        });
    }
  }, []);

  return <>{children}</>;
}
