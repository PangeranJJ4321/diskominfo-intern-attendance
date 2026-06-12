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
  /** Appends a holiday to the store optimistically after a successful create. */
  addHoliday: (holiday: Holiday) => void;
  /** Replaces an existing holiday in the store after a successful update. */
  updateHoliday: (updated: Holiday) => void;
  /** Removes a holiday from the store after a successful deletion. */
  deleteHoliday: (id: string) => void;
}

/**
 * Zustand store holding holidays.
 * Components subscribe to `holidays` and call `fetchHolidays` on mount.
 *
 * Mutations (`addHoliday`, `updateHoliday`, `deleteHoliday`) allow admin
 * operations to update the store without a full re-fetch, ensuring
 * cross-component reactivity (e.g. user-attendances calendar updates
 * immediately after an admin adds a holiday).
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

  addHoliday: (holiday) =>
    set((state) => ({ holidays: [...state.holidays, holiday] })),

  updateHoliday: (updated) =>
    set((state) => ({
      holidays: state.holidays.map((h) => (h.id === updated.id ? updated : h)),
    })),

  deleteHoliday: (id) =>
    set((state) => ({
      holidays: state.holidays.filter((h) => h.id !== id),
    })),
}));
