"use client";

import { create } from "zustand";
import type { ShiftAssignment } from "@/interfaces/models";
import { getShiftAssignments } from "@/lib/services/shift-assignments";

interface AssignmentState {
  assignments: ShiftAssignment[];
  loading: boolean;
  fetchAssignments: (
    limit?: number,
    startDate?: string,
    endDate?: string,
  ) => Promise<void>;
  /** Appends an assignment to the store after a successful create. */
  addAssignment: (assignment: ShiftAssignment) => void;
  /** Removes an assignment from the store after a successful deletion. */
  removeAssignment: (id: string) => void;
}

/**
 * Zustand store holding shift assignments.
 * Components subscribe to `assignments` and call `fetchAssignments` on mount.
 *
 * Mutations (`addAssignment`, `removeAssignment`) allow admin operations to
 * update the store without a full re-fetch, ensuring cross-component reactivity.
 */
export const useAssignmentStore = create<AssignmentState>((set) => ({
  assignments: [],
  loading: false,

  fetchAssignments: async (
    limit = 1000,
    startDate?: string,
    endDate?: string,
  ) => {
    set({ loading: true });
    try {
      const data = await getShiftAssignments(limit, startDate, endDate);
      set({ assignments: data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  addAssignment: (assignment) =>
    set((state) => ({ assignments: [...state.assignments, assignment] })),

  removeAssignment: (id) =>
    set((state) => ({
      assignments: state.assignments.filter((a) => a.id !== id),
    })),
}));
