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
  MapZoomControl,
} from "@/components/ui/map";
import { LocationPermissionDialog } from "@/components/custom/location-permission-dialog";

function AutoFlyToUser() {
  const map = useMap();

  useEffect(() => {
    map.locate({ setView: true, maxZoom: 16, enableHighAccuracy: true });
  }, [map]);

  return null;
}

import { type AttendanceAreaMapProps } from "@/interfaces/admin";

export default function AttendanceAreaMap({
  mapCenter,
  draftLayers,
  hasGeoData,
  onLayersChange,
}: AttendanceAreaMapProps) {
  const [mapStyle, setMapStyle] = useState<"street" | "satellite">("street");
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [permissionState, setPermissionState] = useState<PermissionState | "unknown">("unknown");

  useEffect(() => {
    if (hasGeoData) return;
    if (typeof window === "undefined" || !navigator.permissions) return;

    navigator.permissions
      .query({ name: "geolocation" })
      .then((result) => {
        setPermissionState(result.state);
        if (result.state === "prompt") {
          setShowPermissionDialog(true);
        }
        result.onchange = () => {
          setPermissionState(result.state);
        };
      })
      .catch(() => { });
  }, [hasGeoData]);

  return (
    <div className="relative z-0 overflow-hidden rounded-lg border bg-background">
      <LocationPermissionDialog
        open={showPermissionDialog}
        onOpenChange={setShowPermissionDialog}
        onGranted={() => {
          setPermissionState("granted");
        }}
        onDenied={(err) => {
          console.error("Location permission denied in dialog:", err);
          setPermissionState("denied");
        }}
      />

      <div className="absolute right-3 top-3 z-100 flex rounded-md border bg-background/95 shadow-sm backdrop-blur-sm">
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

      <div className="h-96 min-h-96">
        <Map center={mapCenter} zoom={16} scrollWheelZoom={true} className="min-h-0">
          {mapStyle === "street" ? (
            <MapTileLayer />
          ) : (
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
            />
          )}

          <MapLocateControl
            position="right-3 bottom-3"
            onLocationError={(error) => {
              console.error("Location error:", error.message);
              setShowPermissionDialog(true);
            }}
          />

          {!hasGeoData && (permissionState === "granted" || permissionState === "unknown") && (
            <AutoFlyToUser />
          )}

          <MapZoomControl position="bottom-3 left-3" />

          <MapDrawControl
            position="top-3 left-3"
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
