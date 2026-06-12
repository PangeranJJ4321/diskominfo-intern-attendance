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
}

/**
 * Zustand store holding shift assignments.
 * Components subscribe to `assignments` and call `fetchAssignments` on mount.
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
}));
