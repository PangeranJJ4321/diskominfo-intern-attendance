"use client";

import { create } from "zustand";
import type { Schedule } from "@/interfaces/models";
import { getSchedules } from "@/lib/services/schedules";

interface ScheduleState {
  schedules: Schedule[];
  loading: boolean;
  fetchSchedules: (limit?: number, dayOfWeek?: number[]) => Promise<void>;
  /** Appends a schedule to the store after a successful create. */
  addSchedule: (schedule: Schedule) => void;
  /** Replaces an existing schedule in the store after a successful update. */
  updateSchedule: (updated: Schedule) => void;
  /** Removes a schedule from the store after a successful deletion. */
  deleteSchedule: (id: string) => void;
}

/**
 * Zustand store holding work schedules.
 * Components subscribe to `schedules` and call `fetchSchedules` on mount.
 *
 * Mutations (`addSchedule`, `updateSchedule`, `deleteSchedule`) allow admin
 * operations to update the store without a full re-fetch, ensuring
 * cross-component reactivity.
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

  addSchedule: (schedule) =>
    set((state) => ({ schedules: [...state.schedules, schedule] })),

  updateSchedule: (updated) =>
    set((state) => ({
      schedules: state.schedules.map((s) =>
        s.id === updated.id ? updated : s,
      ),
    })),

  deleteSchedule: (id) =>
    set((state) => ({
      schedules: state.schedules.filter((s) => s.id !== id),
    })),
}));
