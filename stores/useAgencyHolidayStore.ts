"use client";

import { create } from "zustand";
import type { AgencyHoliday } from "@/interfaces/models";
import * as holidayService from "@/lib/services/holidays";

/** State shape for the agency holiday store */
interface AgencyHolidayState {
  /** All agency holidays */
  holidays: AgencyHoliday[];
  /** Whether a fetch operation is in progress */
  loading: boolean;
  /** Latest error message, if any */
  error: string | null;
}

/** Actions exposed by the agency holiday store */
interface AgencyHolidayActions {
  /** Fetch all holidays, optionally filtered by date range */
  fetchHolidays: (
    limit?: number,
    startDate?: string,
    endDate?: string,
    force?: boolean,
  ) => Promise<void>;
  /** Create a new holiday */
  createHoliday: (data: Omit<AgencyHoliday, "id">) => Promise<void>;
  /** Update an existing holiday */
  updateHoliday: (
    id: string,
    data: Partial<Omit<AgencyHoliday, "id">>,
  ) => Promise<void>;
  /** Delete a holiday */
  deleteHoliday: (id: string) => Promise<void>;
  /** Clear the error state */
  clearError: () => void;
}

export const useAgencyHolidayStore = create<
  AgencyHolidayState & AgencyHolidayActions
>((set, get) => ({
  holidays: [],
  loading: false,
  error: null,

  fetchHolidays: async (limit = 1000, startDate, endDate, force = false) => {
    const { holidays, loading } = get();
    if (!force && (holidays.length > 0 || loading)) return;

    set({ loading: true, error: null });
    try {
      const holidays = await holidayService.getHolidays(
        limit,
        startDate,
        endDate,
      );
      set({ holidays, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  createHoliday: async (data) => {
    set({ loading: true, error: null });
    try {
      const holiday = await holidayService.createHoliday(data);
      set((state) => ({
        holidays: [...state.holidays, holiday],
        loading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  updateHoliday: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const updated = await holidayService.updateHoliday(id, data);
      set((state) => ({
        holidays: state.holidays.map((h) => (h.id === id ? updated : h)),
        loading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  deleteHoliday: async (id) => {
    set({ loading: true, error: null });
    try {
      await holidayService.deleteHoliday(id);
      set((state) => ({
        holidays: state.holidays.filter((h) => h.id !== id),
        loading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
