"use client";

import { create } from "zustand";
import type { Shift } from "@/interfaces/models";
import * as shiftService from "@/lib/services/shifts";

/** State shape for the shift store */
interface ShiftState {
  /** All shifts */
  shifts: Shift[];
  /** Whether a fetch operation is in progress */
  loading: boolean;
  /** Latest error message, if any */
  error: string | null;
}

/** Actions exposed by the shift store */
interface ShiftActions {
  /** Fetch all shifts */
  fetchShifts: (limit?: number) => Promise<void>;
  /** Create a new shift */
  createShift: (name: string, workOnHolidays?: boolean) => Promise<void>;
  /** Update an existing shift */
  updateShift: (
    id: string,
    name: string,
    workOnHolidays?: boolean,
  ) => Promise<void>;
  /** Delete a shift */
  deleteShift: (id: string) => Promise<void>;
  /** Clear the error state */
  clearError: () => void;
}

export const useShiftStore = create<ShiftState & ShiftActions>((set) => ({
  shifts: [],
  loading: false,
  error: null,

  fetchShifts: async (limit = 1000) => {
    set({ loading: true, error: null });
    try {
      const shifts = await shiftService.getShifts(limit);
      set({ shifts, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  createShift: async (name, workOnHolidays = false) => {
    set({ loading: true, error: null });
    try {
      const shift = await shiftService.createShift(name, workOnHolidays);
      set((state) => ({
        shifts: [...state.shifts, shift],
        loading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  updateShift: async (id, name, workOnHolidays) => {
    set({ loading: true, error: null });
    try {
      const updated = await shiftService.updateShift(id, name, workOnHolidays);
      set((state) => ({
        shifts: state.shifts.map((s) => (s.id === id ? updated : s)),
        loading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  deleteShift: async (id) => {
    set({ loading: true, error: null });
    try {
      await shiftService.deleteShift(id);
      set((state) => ({
        shifts: state.shifts.filter((s) => s.id !== id),
        loading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
