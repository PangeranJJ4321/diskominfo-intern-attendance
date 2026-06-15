"use client";

import { useEffect, useState } from "react";
import { TileLayer, GeoJSON } from "react-leaflet";
import { MapIcon, Satellite } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Map, MapLocateControl, MapTileLayer } from "@/components/ui/map";
import { LocationPermissionDialog } from "@/components/custom/location-permission-dialog";
import { type LiveLocationMapProps } from "@/interfaces/dashboard";
import { useLocationStore } from "@/stores/useLocationStore";

/**
 * Helper component to auto-trigger the MapLocateControl button once it mounts.
 *
 * @param props - Component properties.
 */
function AutoClickLocate({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled) return;
    const timer = setTimeout(() => {
      const locateBtn = document.getElementById("auto-locate-btn");
      if (
        locateBtn &&
        locateBtn.getAttribute("aria-label") === "Start location tracking"
      ) {
        locateBtn.click();
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [enabled]);

  return null;
}

/**
 * Main map component that tracks and displays user location relative to geofence area.
 * Uses Zustand location store instead of callback prop drilling for location changes.
 *
 * @param props - Component properties.
 */
export default function LiveLocationMap({ geoData }: LiveLocationMapProps) {
  const setCurrentLocation = useLocationStore((s) => s.setCurrentLocation);
  const [mapStyle, setMapStyle] = useState<"street" | "satellite">("street");
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [permissionState, setPermissionState] = useState<
    PermissionState | "unknown"
  >("unknown");

  useEffect(() => {
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
      .catch(() => {});
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl border bg-background h-90 min-h-90">
      <LocationPermissionDialog
        open={showPermissionDialog}
        onOpenChange={setShowPermissionDialog}
        onGranted={(position) => {
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
          setPermissionState("granted");
        }}
        onDenied={(err) => {
          console.error("Location permission denied in dialog:", err);
          setPermissionState("denied");
        }}
      />

      <div className="absolute right-3 top-3 z-1000 flex rounded-md border bg-background/95 shadow-sm backdrop-blur-sm">
        <Button
          variant={mapStyle === "street" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setMapStyle("street")}
          className="rounded-r-none border-r px-3 focus-visible:z-10 text-xs h-8"
        >
          <MapIcon className="mr-1.5 h-3.5 w-3.5" />
          Street
        </Button>
        <Button
          variant={mapStyle === "satellite" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setMapStyle("satellite")}
          className="rounded-l-none px-3 focus-visible:z-10 text-xs h-8"
        >
          <Satellite className="mr-1.5 h-3.5 w-3.5" />
          Satellite
        </Button>
      </div>

      <div className="h-full w-full">
        <Map
          center={[0, 0]}
          zoom={16}
          className="h-full w-full rounded-2xl min-h-0"
        >
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
            id="auto-locate-btn"
            watch
            position="right-3 bottom-3"
            onLocationFound={(e) => {
              setCurrentLocation({
                latitude: e.latlng.lat,
                longitude: e.latlng.lng,
                accuracy: e.accuracy,
              });
            }}
            onLocationError={(error) => {
              console.error("Location tracking failed:", error.message);
              setShowPermissionDialog(true);
            }}
          />

          <AutoClickLocate
            enabled={
              permissionState === "granted" || permissionState === "unknown"
            }
          />

          {geoData && (
            <GeoJSON
              key={JSON.stringify(geoData)}
              data={geoData}
              style={{
                color: "var(--color-primary)",
                weight: 3,
                opacity: 0.8,
                fillColor: "var(--color-primary)",
                fillOpacity: 0.15,
              }}
            />
          )}
        </Map>
      </div>
    </div>
  );
}
