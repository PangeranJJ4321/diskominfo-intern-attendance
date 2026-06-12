"use client";

import { create } from "zustand";
import type { Institution } from "@/interfaces/models";
import * as institutionService from "@/lib/services/institutions";

/** State shape for the institution store */
interface InstitutionState {
  /** All institutions */
  institutions: Institution[];
  /** Whether a fetch operation is in progress */
  loading: boolean;
  /** Latest error message, if any */
  error: string | null;
}

/** Actions exposed by the institution store */
interface InstitutionActions {
  /** Fetch all institutions */
  fetchInstitutions: (limit?: number) => Promise<void>;
  /** Create a new institution */
  createInstitution: (name: string) => Promise<void>;
  /** Update an existing institution */
  updateInstitution: (id: string, name: string) => Promise<void>;
  /** Delete an institution */
  deleteInstitution: (id: string) => Promise<void>;
  /** Clear the error state */
  clearError: () => void;
}

export const useInstitutionStore = create<
  InstitutionState & InstitutionActions
>((set) => ({
  institutions: [],
  loading: false,
  error: null,

  fetchInstitutions: async (limit = 1000) => {
    set({ loading: true, error: null });
    try {
      const institutions = await institutionService.getInstitutions(limit);
      set({ institutions, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  createInstitution: async (name) => {
    set({ loading: true, error: null });
    try {
      const institution = await institutionService.createInstitution(name);
      set((state) => ({
        institutions: [...state.institutions, institution],
        loading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  updateInstitution: async (id, name) => {
    set({ loading: true, error: null });
    try {
      const updated = await institutionService.updateInstitution(id, name);
      set((state) => ({
        institutions: state.institutions.map((i) =>
          i.id === id ? updated : i,
        ),
        loading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  deleteInstitution: async (id) => {
    set({ loading: true, error: null });
    try {
      await institutionService.deleteInstitution(id);
      set((state) => ({
        institutions: state.institutions.filter((i) => i.id !== id),
        loading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
