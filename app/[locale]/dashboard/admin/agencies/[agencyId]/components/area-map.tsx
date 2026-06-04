// app/[locale]/dashboard/admin/agencies/[agencyId]/components/area-map.tsx
"use client";

import { useEffect, useState } from "react";
import { useMap, TileLayer } from "react-leaflet";
import { Map as MapIcon, Satellite } from "lucide-react";
import type { GeoJsonObject } from "geojson";

import { Button } from "@/components/ui/button";
import {
  Map,
  MapDrawControl,
  MapDrawDelete,
  MapDrawEdit,
  MapDrawPolygon,
  MapDrawUndo,
  MapLocateControl,
  MapTileLayer,
} from "@/components/ui/map";

function AutoFlyToUser() {
  const map = useMap();

  useEffect(() => {
    map.locate({ setView: true, maxZoom: 16, enableHighAccuracy: true });
  }, [map]);

  return null;
}

interface AreaMapProps {
  mapCenter: [number, number];
  draftLayers: GeoJsonObject[];
  hasGeoData: boolean;
  onLayersChange: (layers: GeoJsonObject[]) => void;
}

export default function AreaMap({
  mapCenter,
  draftLayers,
  hasGeoData,
  onLayersChange,
}: AreaMapProps) {
  const [mapStyle, setMapStyle] = useState<"street" | "satellite">("street");

  return (
    <div className="relative overflow-hidden rounded-2xl border bg-background">
      <div className="absolute right-3 top-3 z-1000 flex rounded-md border bg-background/95 shadow-sm backdrop-blur-sm">
        <Button
          variant={mapStyle === "street" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setMapStyle("street")}
          className="rounded-r-none border-r px-3 focus-visible:z-10"
        >
          <MapIcon className="mr-2 h-4 w-4" />
          Street
        </Button>
        <Button
          variant={mapStyle === "satellite" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setMapStyle("satellite")}
          className="rounded-l-none px-3 focus-visible:z-10"
        >
          <Satellite className="mr-2 h-4 w-4" />
          Satellite
        </Button>
      </div>

      <div className="h-130 min-h-130">
        <Map center={mapCenter} zoom={16}>
          {mapStyle === "street" ? (
            <MapTileLayer />
          ) : (
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
            />
          )}

          <MapLocateControl />

          {!hasGeoData && <AutoFlyToUser />}

          <MapDrawControl
            initialLayers={draftLayers}
            onLayersChange={(layers) => {
              const nextLayers: GeoJsonObject[] = [];
              layers.eachLayer((layer) => {
                const geoJson = (
                  layer as unknown as { toGeoJSON: () => unknown }
                ).toGeoJSON() as GeoJsonObject;
                nextLayers.push(geoJson);
              });
              onLayersChange(nextLayers);
            }}
          >
            <MapDrawPolygon allowIntersection={false} />
            <MapDrawEdit />
            <MapDrawDelete />
            <MapDrawUndo />
          </MapDrawControl>
        </Map>
      </div>
    </div>
  );
}
