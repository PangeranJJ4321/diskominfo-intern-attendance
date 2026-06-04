"use client";

import { useEffect, useState } from "react";
import type { GeoJsonObject } from "geojson";
import dynamic from "next/dynamic";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { agencyAreaSchema } from "@/lib/schemas/agency-area";

// Dynamically import the map component with SSR disabled
const LiveLocationMap = dynamic(() => import("./live-location-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-130 items-center justify-center rounded-2xl border bg-muted/10">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Spinner />
        <span>Memuat peta...</span>
      </div>
    </div>
  ),
});

type AgencyAreaState = {
  id: string;
  geoData: GeoJsonObject | null;
};

export default function AttendanceMap({ agencyId }: { agencyId?: string }) {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [areaState, setAreaState] = useState<AgencyAreaState>({
    id: "",
    geoData: null,
  });

  useEffect(() => {
    const abortController = new AbortController();

    if (!agencyId) {
      return; // Return immediately to avoid unnecessary side effects
    }

    async function loadArea() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const response = await fetch(`/api/agency-areas/${agencyId}`, {
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error("Gagal memuat area dinas");
        }

        const payload = await response.json();

        // Handle case where API returns null (no area mapped yet)
        if (!payload) {
          setAreaState({ id: "", geoData: null });
          return;
        }

        const parsed = agencyAreaSchema.safeParse(payload);

        if (!parsed.success) {
          console.error("Zod parse error:", parsed.error);
          setAreaState({ id: "", geoData: null });
          return;
        }

        const nextArea = {
          id: parsed.data.id,
          geoData: parsed.data.geoData as unknown as GeoJsonObject,
        } satisfies AgencyAreaState;

        setAreaState(nextArea);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        setLoadError(
          error instanceof Error ? error.message : "Gagal memuat area dinas",
        );
        setAreaState({ id: "", geoData: null });
      } finally {
        setIsLoading(false);
      }
    }

    void loadArea();

    return () => abortController.abort();
  }, [agencyId, reloadNonce]);

  // 1. Check for agency ID first (Avoids the 'isLoading' block if there is no ID)
  if (!agencyId) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">
          Agency ID belum tersedia.
        </p>
      </Card>
    );
  }

  // 2. Then check if loading
  if (isLoading) {
    return (
      <Card className="flex flex-col items-center justify-center gap-4 p-10 text-muted-foreground">
        <Spinner className="size-8" />
        <p className="text-sm">Memuat area dinas...</p>
      </Card>
    );
  }

  // 3. Check for errors
  if (loadError) {
    return (
      <Card className="border-destructive/20 bg-destructive/5 p-6">
        <div className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Area Dinas</h2>
            <p className="text-sm text-muted-foreground">{loadError}</p>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setLoadError(null);
              setIsLoading(true);
              setAreaState({ id: "", geoData: null });
              setReloadNonce((currentValue) => currentValue + 1);
            }}
          >
            Coba lagi
          </Button>
        </div>
      </Card>
    );
  }

  // 4. Successful render
  return (
    <Card className="overflow-hidden p-4">
      <div className="space-y-6">
        {/* The Map Component is dynamically loaded here */}
        <LiveLocationMap geoData={areaState.geoData} />

        {!areaState.geoData && (
          <p className="text-sm text-muted-foreground">
            Belum ada area (polygon) yang ditentukan untuk dinas ini.
          </p>
        )}
      </div>
    </Card>
  );
}
