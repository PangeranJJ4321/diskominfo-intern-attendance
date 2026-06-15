"use client";

import { create } from "zustand";
import type { ShiftAssignment } from "@/interfaces/models";
import * as shiftAssignmentService from "@/lib/services/shift-assignments";

/** State shape for the shift assignment store */
interface ShiftAssignmentState {
  /** All shift assignments */
  assignments: ShiftAssignment[];
  /** Whether a fetch operation is in progress */
  loading: boolean;
  /** Latest error message, if any */
  error: string | null;
}

/** Actions exposed by the shift assignment store */
interface ShiftAssignmentActions {
  /** Fetch all shift assignments, optionally filtered by date range */
  fetchAssignments: (
    limit?: number,
    startDate?: string,
    endDate?: string,
  ) => Promise<void>;
  /** Create a new shift assignment */
  createAssignment: (
    data: Omit<ShiftAssignment, "id" | "user" | "shift">,
  ) => Promise<void>;
  /** Update an existing shift assignment */
  updateAssignment: (
    id: string,
    data: Partial<Omit<ShiftAssignment, "id" | "userId" | "user" | "shift">>,
  ) => Promise<void>;
  /** Delete a shift assignment */
  deleteAssignment: (id: string) => Promise<void>;
  /** Clear the error state */
  clearError: () => void;
}

export const useShiftAssignmentStore = create<
  ShiftAssignmentState & ShiftAssignmentActions
>((set) => ({
  assignments: [],
  loading: false,
  error: null,

  fetchAssignments: async (limit = 1000, startDate, endDate) => {
    set({ loading: true, error: null });
    try {
      const assignments = await shiftAssignmentService.getShiftAssignments(
        limit,
        startDate,
        endDate,
      );
      set({ assignments, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  createAssignment: async (data) => {
    set({ loading: true, error: null });
    try {
      const assignment =
        await shiftAssignmentService.createShiftAssignment(data);
      set((state) => ({
        assignments: [...state.assignments, assignment],
        loading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  updateAssignment: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const updated = await shiftAssignmentService.updateShiftAssignment(
        id,
        data,
      );
      set((state) => ({
        assignments: state.assignments.map((a) => (a.id === id ? updated : a)),
        loading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  deleteAssignment: async (id) => {
    set({ loading: true, error: null });
    try {
      await shiftAssignmentService.deleteShiftAssignment(id);
      set((state) => ({
        assignments: state.assignments.filter((a) => a.id !== id),
        loading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
