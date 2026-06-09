"use client";

import { useEffect, useMemo, useState } from "react";
import type { FeatureCollection, GeoJsonObject } from "geojson";
import { toast } from "sonner";
import dynamic from "next/dynamic";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  extractGeoJsonLayers,
  getGeoJsonCenter,
  toFeatureCollection,
} from "@/lib/geo-utils";

// Dynamically import the map component with SSR disabled
const AttendanceAreaMap = dynamic(() => import("./attendance-area-map"), {
  ssr: false,
  loading: () => <Skeleton className="h-96 w-full rounded-lg" />,
});

import {
  getAttendanceAreas,
  createAttendanceArea,
  updateAttendanceArea,
} from "@/lib/services/attendance-areas";
import type { AttendanceAreaState } from "@/interfaces/admin";

// ── API fetch and save functions ───────────────────────────────────────────
/**
 * Fetches the first attendance area from the database.
 * 
 * @returns A promise that resolves to the attendance area state.
 */
async function fetchAttendanceArea(): Promise<AttendanceAreaState> {
  const areas = await getAttendanceAreas(1);
  if (areas.length > 0) {
    return {
      id: areas[0].id,
      geoData: areas[0].geoData as GeoJsonObject,
      timezone: areas[0].timezone,
    };
  }
  return {
    id: "",
    geoData: null,
    timezone: "Asia/Makassar",
  };
}

/**
 * Saves the attendance area geo JSON data to the database.
 * 
 * @param id - The ID of the attendance area to update, or empty string to create a new one.
 * @param geoData - The GeoJSON FeatureCollection to save.
 * @returns A promise that resolves to the saved attendance area state.
 */
async function saveAttendanceArea(
  id: string,
  geoData: FeatureCollection,
): Promise<AttendanceAreaState> {
  let saved;
  if (id) {
    saved = await updateAttendanceArea(id, geoData);
  } else {
    saved = await createAttendanceArea(geoData);
  }
  return {
    id: saved.id,
    geoData: saved.geoData as GeoJsonObject,
    timezone: saved.timezone,
  };
}

// ── Main component ─────────────────────────────────────────────────────────
export default function AreaMapEditorCard() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [areaState, setAreaState] = useState<AttendanceAreaState>({
    id: "",
    geoData: null,
    timezone: "Asia/Makassar",
  });
  const [draftLayers, setDraftLayers] = useState<GeoJsonObject[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadArea() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const data = await fetchAttendanceArea();

        if (cancelled) return;

        setAreaState(data);
        setDraftLayers(extractGeoJsonLayers(data.geoData));
      } catch (error) {
        if (cancelled) return;

        setLoadError(
          error instanceof Error
            ? error.message
            : "Gagal memuat area presensi",
        );
        setAreaState({ id: "", geoData: null, timezone: "Asia/Makassar" });
        setDraftLayers([]);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadArea();

    return () => {
      cancelled = true;
    };
  }, [reloadNonce]);

  const mapCenter = useMemo(
    () => getGeoJsonCenter(areaState.geoData),
    [areaState.geoData],
  );

  const hasLayers = draftLayers.length > 0;

  const handleSave = async () => {
    setIsSaving(true);

    const previousState = areaState;
    const nextGeoData = toFeatureCollection(draftLayers);
    const optimisticState: AttendanceAreaState = {
      ...previousState,
      geoData: nextGeoData,
    };

    setAreaState(optimisticState);

    try {
      const saved = await saveAttendanceArea(areaState.id, nextGeoData);

      setAreaState(saved);
      setDraftLayers(extractGeoJsonLayers(saved.geoData));
      toast.success("Area presensi berhasil disimpan");
    } catch (error) {
      setAreaState(previousState);
      setDraftLayers(extractGeoJsonLayers(previousState.geoData));
      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal menyimpan area presensi",
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="overflow-hidden p-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <Skeleton className="h-96 w-full rounded-lg animate-pulse" />
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-1/2 animate-pulse" />
            <Skeleton className="h-9 w-24 rounded-lg animate-pulse" />
          </div>
        </div>
      </Card>
    );
  }

  if (loadError) {
    return (
      <Card className="border-destructive/20 bg-destructive/5 p-6">
        <div className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Editor Area Presensi</h2>
            <p className="text-sm text-muted-foreground">{loadError}</p>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setLoadError(null);
              setIsLoading(true);
              setAreaState({
                id: "",
                geoData: null,
                timezone: "Asia/Makassar",
              });
              setDraftLayers([]);
              setReloadNonce((currentValue) => currentValue + 1);
            }}
          >
            Coba lagi
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden p-6">
      <div className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Editor Area Presensi</h2>
          <p className="text-sm text-muted-foreground">
            Gambar polygon untuk menentukan area presensi. Area yang sudah
            tersimpan akan ditampilkan saat halaman dibuka.
          </p>
        </div>

        {/* The Map Component is dynamically loaded here */}
        <AttendanceAreaMap
          mapCenter={mapCenter}
          draftLayers={draftLayers}
          hasGeoData={!!areaState.geoData}
          onLayersChange={setDraftLayers}
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {hasLayers
              ? "Gunakan edit atau delete untuk menyesuaikan polygon yang sudah ada."
              : "Belum ada polygon. Tambahkan polygon baru untuk menyimpan area presensi."}
          </p>

          <Button type="button" onClick={handleSave} loading={isSaving}>
            Simpan area
          </Button>
        </div>
      </div>
    </Card>
  );
}
