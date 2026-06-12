"use client";

import { create } from "zustand";
import type { Schedule } from "@/interfaces/models";
import { getSchedules } from "@/lib/services/schedules";

interface ScheduleState {
  schedules: Schedule[];
  loading: boolean;
  fetchSchedules: (limit?: number, dayOfWeek?: number[]) => Promise<void>;
}

/**
 * Zustand store holding work schedules.
 * Components subscribe to `schedules` and call `fetchSchedules` on mount.
 */
export const useScheduleStore = create<ScheduleState>((set) => ({
  schedules: [],
  loading: false,

  fetchSchedules: async (limit = 1000, dayOfWeek?: number[]) => {
    set({ loading: true });
    try {
      const data = await getSchedules(limit, dayOfWeek);
      set({ schedules: data, loading: false });
    } catch {
      set({ loading: false });
    }
  },
}));
