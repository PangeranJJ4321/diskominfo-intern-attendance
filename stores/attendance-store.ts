"use client";

import { create } from "zustand";
import type { Attendance } from "@/interfaces/models";
import { getAttendancesForUser } from "@/lib/services/attendances";
import { getUserFaceDescriptors } from "@/lib/services/users";

interface AttendanceState {
  attendances: Attendance[];
  userHasFaceRegistered: boolean;
  loading: boolean;
  fetchAttendances: (
    userId: string,
    limit?: number,
    startDate?: string,
    endDate?: string,
  ) => Promise<void>;
  refreshAttendances: (
    userId: string,
    limit?: number,
    startDate?: string,
    endDate?: string,
  ) => Promise<void>;
  checkFaceRegistration: (userId: string) => Promise<void>;
  /** Replaces a specific attendance record in the store (used after edit/create) */
  upsertAttendance: (attendance: Attendance) => void;
}

/**
 * Zustand store holding attendance records and face-registration status.
 * Components subscribe to `attendances` / `userHasFaceRegistered` and
 * call `fetchAttendances` on mount. After a new attendance is created
 * or edited, call `invalidate` to re-fetch.
 */
export const useAttendanceStore = create<AttendanceState>((set) => ({
  attendances: [],
  userHasFaceRegistered: false,
  loading: false,

  fetchAttendances: async (userId, limit = 1000, startDate, endDate) => {
    set({ loading: true });
    try {
      const data = await getAttendancesForUser(
        userId,
        limit,
        startDate,
        endDate,
      );
      set({ attendances: data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  /** Convenience alias for re-fetching attendances (same behaviour). */
  refreshAttendances: async (userId, limit = 1000, startDate, endDate) => {
    set({ loading: true });
    try {
      const data = await getAttendancesForUser(
        userId,
        limit,
        startDate,
        endDate,
      );
      set({ attendances: data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  checkFaceRegistration: async (userId) => {
    try {
      const { data } = await getUserFaceDescriptors(userId);
      set({ userHasFaceRegistered: Array.isArray(data) && data.length > 0 });
    } catch {
      set({ userHasFaceRegistered: false });
    }
  },

  upsertAttendance: (attendance) => {
    set((state) => {
      const idx = state.attendances.findIndex((a) => a.id === attendance.id);
      if (idx >= 0) {
        const copy = [...state.attendances];
        copy[idx] = attendance;
        return { attendances: copy };
      }
      return { attendances: [...state.attendances, attendance] };
    });
  },
}));
