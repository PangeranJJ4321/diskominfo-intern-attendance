"use client";

import { create } from "zustand";
import type { Holiday } from "@/interfaces/models";
import { getHolidays } from "@/lib/services/holidays";

interface HolidayState {
  holidays: Holiday[];
  loading: boolean;
  fetchHolidays: (
    limit?: number,
    startDate?: string,
    endDate?: string,
  ) => Promise<void>;
}

/**
 * Zustand store holding holidays.
 * Components subscribe to `holidays` and call `fetchHolidays` on mount.
 */
export const useHolidayStore = create<HolidayState>((set) => ({
  holidays: [],
  loading: false,

  fetchHolidays: async (limit = 1000, startDate?: string, endDate?: string) => {
    set({ loading: true });
    try {
      const data = await getHolidays(limit, startDate, endDate);
      set({ holidays: data, loading: false });
    } catch {
      set({ loading: false });
    }
  },
}));
