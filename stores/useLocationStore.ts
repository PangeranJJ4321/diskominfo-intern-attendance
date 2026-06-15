"use client";

import { create } from "zustand";
import type { GeoJsonObject } from "geojson";
import { isLocationWithinArea } from "@/lib/location-within-area";

/** Location coordinates with accuracy */
export interface LocationCoords {
  latitude: number;
  longitude: number;
  accuracy: number;
}

/** State shape for the location store */
interface LocationState {
  /** Current GPS location of the user */
  currentLocation: LocationCoords | null;
  /** Whether the user is within the geofence area */
  isWithinGeofence: boolean | null;
  /** The geofence GeoJSON data for the attendance area */
  geoData: GeoJsonObject | null;
  /** Whether a geofence fetch is in progress */
  loading: boolean;
  /** Latest error message, if any */
  error: string | null;
}

/** Actions exposed by the location store */
interface LocationActions {
  /** Set the current GPS location */
  setCurrentLocation: (location: LocationCoords | null) => void;
  /** Set the geofence data */
  setGeoData: (geoData: GeoJsonObject | null) => void;
  /** Recompute isWithinGeofence based on current location and geoData */
  computeGeofence: () => void;
  /** Reset all location state */
  reset: () => void;
}

export const useLocationStore = create<LocationState & LocationActions>(
  (set, get) => ({
    currentLocation: null,
    isWithinGeofence: null,
    geoData: null,
    loading: false,
    error: null,

    setCurrentLocation: (location) => {
      set({ currentLocation: location });
      // Auto-compute geofence when location changes
      const { geoData } = get();
      if (location && geoData) {
        const within = isLocationWithinArea(
          location.latitude,
          location.longitude,
          geoData,
        );
        set({ isWithinGeofence: within });
      } else if (!location) {
        set({ isWithinGeofence: null });
      }
    },

    setGeoData: (geoData) => {
      set({ geoData });
      // Auto-compute geofence when geoData changes
      const { currentLocation } = get();
      if (currentLocation && geoData) {
        const within = isLocationWithinArea(
          currentLocation.latitude,
          currentLocation.longitude,
          geoData,
        );
        set({ isWithinGeofence: within });
      } else if (!geoData) {
        set({ isWithinGeofence: null });
      }
    },

    computeGeofence: () => {
      const { currentLocation, geoData } = get();
      if (currentLocation && geoData) {
        const within = isLocationWithinArea(
          currentLocation.latitude,
          currentLocation.longitude,
          geoData,
        );
        set({ isWithinGeofence: within });
      }
    },

    reset: () => {
      set({
        currentLocation: null,
        isWithinGeofence: null,
        geoData: null,
        loading: false,
        error: null,
      });
    },
  }),
);
