"use client";

import { create } from "zustand";
import type { LocationLog } from "@/interfaces/models";
import * as locationLogService from "@/lib/services/location-logs";

/** State shape for the location log store */
interface LocationLogState {
  /** All location logs */
  logs: LocationLog[];
  /** Whether a fetch operation is in progress */
  loading: boolean;
  /** Latest error message, if any */
  error: string | null;
}

/** Actions exposed by the location log store */
interface LocationLogActions {
  /** Fetch all location logs, optionally filtered by date range */
  fetchLogs: (
    limit?: number,
    startDate?: string,
    endDate?: string,
  ) => Promise<void>;
  /** Create a new location log entry */
  createLog: (data: {
    userId: string;
    latitude: number;
    longitude: number;
  }) => Promise<void>;
  /** Clear the error state */
  clearError: () => void;
}

export const useLocationLogStore = create<
  LocationLogState & LocationLogActions
>((set) => ({
  logs: [],
  loading: false,
  error: null,

  fetchLogs: async (limit = 1000, startDate, endDate) => {
    set({ loading: true, error: null });
    try {
      const logs = await locationLogService.getLocationLogs(
        limit,
        startDate,
        endDate,
      );
      set({ logs, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  createLog: async (data) => {
    set({ loading: true, error: null });
    try {
      const log = await locationLogService.createLocationLog(data);
      set((state) => ({
        logs: [...state.logs, log],
        loading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
