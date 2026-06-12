"use client";

import { create } from "zustand";
import type { Schedule } from "@/interfaces/models";
import * as scheduleService from "@/lib/services/schedules";

/** State shape for the schedule store */
interface ScheduleState {
  /** All schedules */
  schedules: Schedule[];
  /** Whether a fetch operation is in progress */
  loading: boolean;
  /** Latest error message, if any */
  error: string | null;
}

/** Actions exposed by the schedule store */
interface ScheduleActions {
  /** Fetch all schedules, optionally filtered by dayOfWeek */
  fetchSchedules: (limit?: number, dayOfWeek?: number[]) => Promise<void>;
  /** Create a new schedule */
  createSchedule: (data: Omit<Schedule, "id">) => Promise<void>;
  /** Update an existing schedule */
  updateSchedule: (
    id: string,
    data: Partial<Omit<Schedule, "id" | "shiftId">>,
  ) => Promise<void>;
  /** Delete a schedule */
  deleteSchedule: (id: string) => Promise<void>;
  /** Clear the error state */
  clearError: () => void;
}

export const useScheduleStore = create<ScheduleState & ScheduleActions>(
  (set) => ({
    schedules: [],
    loading: false,
    error: null,

    fetchSchedules: async (limit = 1000, dayOfWeek) => {
      set({ loading: true, error: null });
      try {
        const schedules = await scheduleService.getSchedules(limit, dayOfWeek);
        set({ schedules, loading: false });
      } catch (err) {
        set({ error: (err as Error).message, loading: false });
      }
    },

    createSchedule: async (data) => {
      set({ loading: true, error: null });
      try {
        const schedule = await scheduleService.createSchedule(data);
        set((state) => ({
          schedules: [...state.schedules, schedule],
          loading: false,
        }));
      } catch (err) {
        set({ error: (err as Error).message, loading: false });
      }
    },

    updateSchedule: async (id, data) => {
      set({ loading: true, error: null });
      try {
        const updated = await scheduleService.updateSchedule(id, data);
        set((state) => ({
          schedules: state.schedules.map((s) => (s.id === id ? updated : s)),
          loading: false,
        }));
      } catch (err) {
        set({ error: (err as Error).message, loading: false });
      }
    },

    deleteSchedule: async (id) => {
      set({ loading: true, error: null });
      try {
        await scheduleService.deleteSchedule(id);
        set((state) => ({
          schedules: state.schedules.filter((s) => s.id !== id),
          loading: false,
        }));
      } catch (err) {
        set({ error: (err as Error).message, loading: false });
      }
    },

    clearError: () => set({ error: null }),
  }),
);
