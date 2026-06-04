"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { GeoJsonObject } from "geojson";

interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
}

interface LocationContextValue {
  currentLocation: LocationCoordinates | null;
  setCurrentLocation: (location: LocationCoordinates | null) => void;
  clearCurrentLocation: () => void;
  areaGeoData: GeoJsonObject | null;
  setAreaGeoData: (geoData: GeoJsonObject | null) => void;
}

const LocationContext = createContext<LocationContextValue | null>(null);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [currentLocation, setCurrentLocation] =
    useState<LocationCoordinates | null>(null);
  const [areaGeoData, setAreaGeoData] = useState<GeoJsonObject | null>(null);

  const contextValue = useMemo<LocationContextValue>(
    () => ({
      currentLocation,
      setCurrentLocation,
      clearCurrentLocation: () => setCurrentLocation(null),
      areaGeoData,
      setAreaGeoData,
    }),
    [areaGeoData, currentLocation],
  );

  return (
    <LocationContext.Provider value={contextValue}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationContext() {
  const context = useContext(LocationContext);

  if (!context) {
    throw new Error("useLocationContext must be used within LocationProvider");
  }

  return context;
}
