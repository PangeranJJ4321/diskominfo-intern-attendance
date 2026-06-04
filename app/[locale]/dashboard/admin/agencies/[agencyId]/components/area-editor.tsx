// app/[locale]/dashboard/admin/agencies/[agencyId]/components/area-editor.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import type { Feature, FeatureCollection, GeoJsonObject } from "geojson";
import { toast } from "sonner";
import dynamic from "next/dynamic";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { agencyAreaSchema } from "@/lib/schemas/agency-area";

// Dynamically import the map component with SSR disabled
const AreaMap = dynamic(() => import("./area-map"), {
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

type AgencyAreaParams = {
  agencyId?: string | string[];
};

type AgencyAreaState = {
  id: string;
  geoData: GeoJsonObject | null;
};

const DEFAULT_MAP_CENTER: [number, number] = [-6.2, 106.816666];

function extractGeoJsonLayers(geoData: GeoJsonObject | null): GeoJsonObject[] {
  if (!geoData) return [];
  if (
    "features" in geoData &&
    Array.isArray((geoData as FeatureCollection).features)
  ) {
    const fc = geoData as FeatureCollection;
    return fc.features.map((f) => f as GeoJsonObject);
  }
  return [geoData];
}

function toFeatureCollection(layers: GeoJsonObject[]): FeatureCollection {
  const features = layers.flatMap((layer) => {
    if (
      "features" in layer &&
      Array.isArray((layer as FeatureCollection).features)
    ) {
      const fc = layer as FeatureCollection;
      return fc.features.map((f) => f as Feature);
    }
    if ("geometry" in layer && (layer as Feature).type === "Feature") {
      return [layer as Feature];
    }
    return [{ type: "Feature", properties: {}, geometry: layer } as Feature];
  });

  return {
    type: "FeatureCollection",
    features,
  };
}

function getGeoJsonCenter(geoData: GeoJsonObject | null): [number, number] {
  if (!geoData) return DEFAULT_MAP_CENTER;

  const points: Array<[number, number]> = [];
  const collectPoints = (value: unknown): void => {
    if (!Array.isArray(value)) return;
    if (typeof value[0] === "number" && typeof value[1] === "number") {
      points.push([value[1], value[0]]);
      return;
    }
    for (const entry of value) {
      collectPoints(entry);
    }
  };

  if (
    "features" in geoData &&
    Array.isArray((geoData as FeatureCollection).features)
  ) {
    const fc = geoData as FeatureCollection;
    for (const feature of fc.features) {
      if (feature.type === "Feature" && feature.geometry) {
        const geom = feature.geometry as unknown as {
          coordinates?: unknown;
          geometries?: unknown;
        };
        if (geom.coordinates !== undefined) {
          collectPoints(geom.coordinates);
        } else if (Array.isArray(geom.geometries)) {
          for (const g of geom.geometries as unknown as Array<unknown>) {
            const sub = g as { coordinates?: unknown };
            if (sub.coordinates !== undefined) collectPoints(sub.coordinates);
          }
        }
      }
    }
  } else if ("geometry" in geoData && (geoData as Feature).geometry) {
    const geom = (geoData as Feature).geometry as unknown as {
      coordinates?: unknown;
      geometries?: unknown;
    };
    if (geom.coordinates !== undefined) {
      collectPoints(geom.coordinates);
    } else if (Array.isArray(geom.geometries)) {
      for (const g of geom.geometries as unknown as Array<unknown>) {
        const sub = g as { coordinates?: unknown };
        if (sub.coordinates !== undefined) collectPoints(sub.coordinates);
      }
    }
  } else {
    const geom = geoData as unknown as {
      coordinates?: unknown;
      geometries?: unknown;
    };
    if (geom.coordinates !== undefined) collectPoints(geom.coordinates);
    else if (Array.isArray(geom.geometries)) {
      for (const g of geom.geometries as unknown as Array<unknown>) {
        const sub = g as { coordinates?: unknown };
        if (sub.coordinates !== undefined) collectPoints(sub.coordinates);
      }
    }
  }

  if (points.length === 0) return DEFAULT_MAP_CENTER;

  const total = points.reduce(
    (accumulator, [lat, lng]) => {
      accumulator[0] += lat;
      accumulator[1] += lng;
      return accumulator;
    },
    [0, 0],
  );

  return [total[0] / points.length, total[1] / points.length];
}

export default function AreaEditor() {
  const params = useParams<AgencyAreaParams>();
  const agencyId = Array.isArray(params.agencyId)
    ? params.agencyId[0]
    : params.agencyId;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [areaState, setAreaState] = useState<AgencyAreaState>({
    id: "",
    geoData: null,
  });
  const [draftLayers, setDraftLayers] = useState<GeoJsonObject[]>([]);

  useEffect(() => {
    const abortController = new AbortController();

    if (!agencyId) {
      return;
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

        const payload: unknown = await response.json();
        const parsed = agencyAreaSchema.safeParse(payload);

        if (!parsed.success) {
          setAreaState({ id: "", geoData: null });
          setDraftLayers([]);
          return;
        }

        const nextArea = {
          id: parsed.data.id,
          geoData: parsed.data.geoData as unknown as GeoJsonObject,
        } satisfies AgencyAreaState;

        setAreaState(nextArea);
        setDraftLayers(extractGeoJsonLayers(nextArea.geoData));
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        setLoadError(
          error instanceof Error ? error.message : "Gagal memuat area dinas",
        );
        setAreaState({ id: "", geoData: null });
        setDraftLayers([]);
      } finally {
        setIsLoading(false);
      }
    }

    void loadArea();

    return () => abortController.abort();
  }, [agencyId, reloadNonce]);

  const mapCenter = useMemo(
    () => getGeoJsonCenter(areaState.geoData),
    [areaState.geoData],
  );

  const hasLayers = draftLayers.length > 0;

  const handleSave = async () => {
    if (!agencyId) {
      toast.error("Agency ID belum tersedia.");
      return;
    }

    setIsSaving(true);

    const previousState = areaState;
    const nextGeoData = toFeatureCollection(draftLayers);
    const optimisticState: AgencyAreaState = {
      ...previousState,
      geoData: nextGeoData,
    };

    setAreaState(optimisticState);

    try {
      const response = await fetch(`/api/agency-areas/${agencyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          geoData: nextGeoData,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error ?? "Gagal menyimpan area dinas");
      }

      const saved = agencyAreaSchema.safeParse(await response.json());

      if (!saved.success) {
        throw new Error("Respons area dinas tidak valid");
      }

      setAreaState({
        id: saved.data.id,
        geoData: saved.data.geoData as unknown as GeoJsonObject,
      });
      setDraftLayers(
        extractGeoJsonLayers(saved.data.geoData as unknown as GeoJsonObject),
      );
      toast.success("Area dinas berhasil disimpan");
    } catch (error) {
      setAreaState(previousState);
      setDraftLayers(extractGeoJsonLayers(previousState.geoData));
      toast.error(
        error instanceof Error ? error.message : "Gagal menyimpan area dinas",
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="flex flex-col items-center justify-center gap-4 p-10 text-muted-foreground">
        <Spinner className="size-8" />
        <p className="text-sm">Memuat editor area dinas...</p>
      </Card>
    );
  }

  if (!agencyId) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">
          Agency ID belum tersedia.
        </p>
      </Card>
    );
  }

  if (loadError) {
    return (
      <Card className="border-destructive/20 bg-destructive/5 p-6">
        <div className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Editor Area Dinas</h2>
            <p className="text-sm text-muted-foreground">{loadError}</p>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setLoadError(null);
              setIsLoading(true);
              setAreaState({ id: "", geoData: null });
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
          <h2 className="text-lg font-semibold">Editor Area Dinas</h2>
          <p className="text-sm text-muted-foreground">
            Gambar polygon untuk menentukan area kerja dinas. Area yang sudah
            tersimpan akan ditampilkan saat halaman dibuka.
          </p>
        </div>

        {/* The Map Component is dynamically loaded here */}
        <AreaMap
          mapCenter={mapCenter}
          draftLayers={draftLayers}
          hasGeoData={!!areaState.geoData}
          onLayersChange={setDraftLayers}
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {hasLayers
              ? "Gunakan edit atau delete untuk menyesuaikan polygon yang sudah ada."
              : "Belum ada polygon. Tambahkan polygon baru untuk menyimpan area dinas."}
          </p>

          <Button type="button" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Menyimpan..." : "Simpan area"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
