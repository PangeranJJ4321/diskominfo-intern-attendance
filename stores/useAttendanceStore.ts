"use client";

import { create } from "zustand";
import type { Attendance } from "@/interfaces/models";
import * as attendanceService from "@/lib/services/attendances";

/** State shape for the attendance store */
interface AttendanceState {
  /** All attendances */
  attendances: Attendance[];
  /** Whether a fetch operation is in progress */
  loading: boolean;
  /** Latest error message, if any */
  error: string | null;
}

/** Actions exposed by the attendance store */
interface AttendanceActions {
  /** Fetch all attendances, optionally filtered by date range */
  fetchAttendances: (
    limit?: number,
    startDate?: string,
    endDate?: string,
  ) => Promise<void>;
  /** Fetch attendances for a specific intern */
  fetchAttendancesForIntern: (
    internId: string,
    limit?: number,
    startDate?: string,
    endDate?: string,
  ) => Promise<void>;
  /** Fetch attendances for a specific user */
  fetchAttendancesForUser: (
    userId: string,
    limit?: number,
    startDate?: string,
    endDate?: string,
  ) => Promise<void>;
  /** Create a new attendance record */
  createAttendance: (data: Omit<Attendance, "id">) => Promise<void>;
  /** Update an existing attendance record */
  updateAttendance: (
    id: string,
    data: Partial<Omit<Attendance, "id">>,
  ) => Promise<void>;
  /** Clear the error state */
  clearError: () => void;
}

export const useAttendanceStore = create<AttendanceState & AttendanceActions>(
  (set) => ({
    attendances: [],
    loading: false,
    error: null,

    fetchAttendances: async (limit = 1000, startDate, endDate) => {
      set({ loading: true, error: null });
      try {
        const attendances = await attendanceService.getAttendances(
          limit,
          startDate,
          endDate,
        );
        set({ attendances, loading: false });
      } catch (err) {
        set({ error: (err as Error).message, loading: false });
      }
    },

    fetchAttendancesForIntern: async (
      internId,
      limit = 1000,
      startDate,
      endDate,
    ) => {
      set({ loading: true, error: null });
      try {
        const attendances = await attendanceService.getAttendancesForIntern(
          internId,
          limit,
          startDate,
          endDate,
        );
        set({ attendances, loading: false });
      } catch (err) {
        set({ error: (err as Error).message, loading: false });
      }
    },

    fetchAttendancesForUser: async (
      userId,
      limit = 1000,
      startDate,
      endDate,
    ) => {
      set({ loading: true, error: null });
      try {
        const attendances = await attendanceService.getAttendancesForUser(
          userId,
          limit,
          startDate,
          endDate,
        );
        set({ attendances, loading: false });
      } catch (err) {
        set({ error: (err as Error).message, loading: false });
      }
    },

    createAttendance: async (data) => {
      set({ loading: true, error: null });
      try {
        const attendance = await attendanceService.createAttendance(data);
        set((state) => ({
          attendances: [...state.attendances, attendance],
          loading: false,
        }));
      } catch (err) {
        set({ error: (err as Error).message, loading: false });
      }
    },

    updateAttendance: async (id, data) => {
      set({ loading: true, error: null });
      try {
        const updated = await attendanceService.updateAttendance(id, data);
        set((state) => ({
          attendances: state.attendances.map((a) =>
            a.id === id ? updated : a,
          ),
          loading: false,
        }));
      } catch (err) {
        set({ error: (err as Error).message, loading: false });
      }
    },

    clearError: () => set({ error: null }),
  }),
);
