"use client";

import { create } from "zustand";
import type { AgencyAccess } from "@/interfaces/models";
import * as agencyAccessService from "@/lib/services/agency-accesses";

/** State shape for the agency access store */
interface AgencyAccessState {
  /** All agency accesses */
  accesses: AgencyAccess[];
  /** Whether a fetch operation is in progress */
  loading: boolean;
  /** Latest error message, if any */
  error: string | null;
}

/** Actions exposed by the agency access store */
interface AgencyAccessActions {
  /** Fetch all agency accesses */
  fetchAccesses: (limit?: number) => Promise<void>;
  /** Create a new agency access */
  createAccess: (agencyId: string, userId: string) => Promise<void>;
  /** Update an existing agency access */
  updateAccess: (
    id: string,
    data: Partial<Pick<AgencyAccess, "agencyId" | "userId">>,
  ) => Promise<void>;
  /** Delete an agency access */
  deleteAccess: (id: string) => Promise<void>;
  /** Clear the error state */
  clearError: () => void;
}

export const useAgencyAccessStore = create<
  AgencyAccessState & AgencyAccessActions
>((set) => ({
  accesses: [],
  loading: false,
  error: null,

  fetchAccesses: async (limit = 1000) => {
    set({ loading: true, error: null });
    try {
      const accesses = await agencyAccessService.getAgencyAccesses(limit);
      set({ accesses, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  createAccess: async (agencyId, userId) => {
    set({ loading: true, error: null });
    try {
      const access = await agencyAccessService.createAgencyAccess(
        agencyId,
        userId,
      );
      set((state) => ({
        accesses: [...state.accesses, access],
        loading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  updateAccess: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const updated = await agencyAccessService.updateAgencyAccess(id, data);
      set((state) => ({
        accesses: state.accesses.map((a) => (a.id === id ? updated : a)),
        loading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  deleteAccess: async (id) => {
    set({ loading: true, error: null });
    try {
      await agencyAccessService.deleteAgencyAccess(id);
      set((state) => ({
        accesses: state.accesses.filter((a) => a.id !== id),
        loading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
