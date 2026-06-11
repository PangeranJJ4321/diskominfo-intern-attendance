"use client";

import { create } from "zustand";
import type { GeoJsonObject } from "geojson";
import { isLocationWithinArea } from "@/lib/location-within-area";

/** Represents a geographic location with accuracy information */
export interface LocationCoords {
  latitude: number;
  longitude: number;
  accuracy: number;
}

/** State shape for the location store */
interface LocationState {
  /** The user's current device location, or null if not yet acquired */
  currentLocation: LocationCoords | null;
  /** The loaded geofence polygon data, or null if not yet loaded */
  geofence: GeoJsonObject | null;
  /** Whether the user is within the geofence area, or null if indeterminate */
  isWithinGeofence: boolean | null;
  /** Whether GPS watching is active (can be toggled by user) */
  watchEnabled: boolean;

  /** Update the current location and recompute geofence status */
  setCurrentLocation: (location: LocationCoords) => void;
  /** Set the geofence data and recompute geofence status */
  setGeofence: (geofence: GeoJsonObject | null) => void;
  /** Toggle GPS watching on/off; when off, clears location */
  setWatchEnabled: (enabled: boolean) => void;
  /** Reset the location state back to its initial values */
  reset: () => void;
}

const initialState = {
  currentLocation: null as LocationCoords | null,
  geofence: null as GeoJsonObject | null,
  isWithinGeofence: null as boolean | null,
  watchEnabled: true,
};

/**
 * Zustand store holding geolocation state shared across the dashboard.
 * Prevents prop drilling by making location data available to any component
 * that imports this store.
 */
export const useLocationStore = create<LocationState>((set, get) => ({
  ...initialState,

  setCurrentLocation: (location: LocationCoords) => {
    const { geofence } = get();
    const within = geofence
      ? isLocationWithinArea(location.latitude, location.longitude, geofence)
      : null;
    set({ currentLocation: location, isWithinGeofence: within });
  },

  setGeofence: (geofence: GeoJsonObject | null) => {
    const { currentLocation } = get();
    const within =
      currentLocation && geofence
        ? isLocationWithinArea(
            currentLocation.latitude,
            currentLocation.longitude,
            geofence,
          )
        : null;
    set({ geofence, isWithinGeofence: within });
  },

  setWatchEnabled: (enabled: boolean) => {
    set({
      watchEnabled: enabled,
      // Clear location when watch is disabled so the UI reflects the stopped
      // tracking state
      ...(enabled ? {} : { currentLocation: null, isWithinGeofence: null }),
    });
  },

  reset: () => set(initialState),
}));
