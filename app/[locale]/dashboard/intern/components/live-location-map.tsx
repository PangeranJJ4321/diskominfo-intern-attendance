"use client";

import { useEffect, useState } from "react";
import { TileLayer, GeoJSON } from "react-leaflet";
import { Map as MapIcon, Satellite } from "lucide-react";
import type { GeoJsonObject } from "geojson";

import { Button } from "@/components/ui/button";
import { Map, MapLocateControl, MapTileLayer } from "@/components/ui/map";
import { useLocationContext } from "../context/location-context";

// Helper component to auto-trigger the MapLocateControl button once it mounts
function AutoClickLocate() {
  useEffect(() => {
    // Small timeout ensures the DOM node is fully painted and Leaflet is ready
    const timer = setTimeout(() => {
      const locateBtn = document.getElementById("auto-locate-btn");
      // Only click it if it is currently in the stopped state
      if (
        locateBtn &&
        locateBtn.getAttribute("aria-label") === "Start location tracking"
      ) {
        locateBtn.click();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return null;
}

export default function LiveLocationMap({
  geoData,
}: {
  geoData: GeoJsonObject | null;
}) {
  const [mapStyle, setMapStyle] = useState<"street" | "satellite">("street");
  const { setCurrentLocation, setAreaGeoData } = useLocationContext();

  useEffect(() => {
    setAreaGeoData(geoData);

    return () => {
      setAreaGeoData(null);
    };
  }, [geoData, setAreaGeoData]);

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
        <Map center={[0, 0]} zoom={16}>
          {mapStyle === "street" ? (
            <MapTileLayer />
          ) : (
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
            />
          )}

          {/* 
            MapLocateControl uses watch mode and handles flying to the user.
            It also renders the pulsing location icon automatically.
          */}
          <MapLocateControl
            id="auto-locate-btn"
            watch
            onLocationFound={(e) => {
              setCurrentLocation({
                latitude: e.latlng.lat,
                longitude: e.latlng.lng,
                accuracy: e.accuracy,
              });
              console.log(
                "📍 Live Location Update -> Lat:",
                e.latlng.lat,
                "Lng:",
                e.latlng.lng,
              );
            }}
            onLocationError={(error) => {
              console.error("Location tracking failed:", error.message);
            }}
          />

          {/* Triggers the button above automatically */}
          <AutoClickLocate />

          {geoData && (
            <GeoJSON
              key={JSON.stringify(geoData)}
              data={geoData}
              style={{
                color: "#3b82f6",
                weight: 3,
                opacity: 0.8,
                fillColor: "#3b82f6",
                fillOpacity: 0.2,
              }}
            />
          )}
        </Map>
      </div>
    </div>
  );
}
