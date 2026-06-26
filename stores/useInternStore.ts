"use client";

import { create } from "zustand";
import type { Intern } from "@/interfaces/models";
import * as internService from "@/lib/services/interns";

/** State shape for the intern store */
interface InternState {
  /** All interns */
  interns: Intern[];
  /** Whether a fetch operation is in progress */
  loading: boolean;
  /** Latest error message, if any */
  error: string | null;
}

/** Actions exposed by the intern store */
interface InternActions {
  /** Fetch all interns with related user, agency, institution */
  fetchInterns: (limit?: number, force?: boolean) => Promise<void>;
  /** Create a new intern record */
  createIntern: (
    data: Omit<
      Intern,
      "id" | "user" | "agency" | "institution" | "createdAt" | "updatedAt"
    >,
  ) => Promise<void>;
  /** Update an existing intern record */
  updateIntern: (
    id: string,
    data: Partial<
      Omit<
        Intern,
        "id" | "user" | "agency" | "institution" | "createdAt" | "updatedAt"
      >
    >,
  ) => Promise<void>;
  /** Delete an intern record */
  deleteIntern: (id: string) => Promise<void>;
  /** Clear the error state */
  clearError: () => void;
}

export const useInternStore = create<InternState & InternActions>((set, get) => ({
  interns: [],
  loading: false,
  error: null,

  fetchInterns: async (limit = 1000, force = false) => {
    const { interns, loading } = get();
    if (!force && (interns.length > 0 || loading)) return;

    set({ loading: true, error: null });
    try {
      const interns = await internService.getInterns(limit);
      set({ interns, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  createIntern: async (data) => {
    set({ loading: true, error: null });
    try {
      const intern = await internService.createIntern(data);
      set((state) => ({
        interns: [...state.interns, intern],
        loading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  updateIntern: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const updated = await internService.updateIntern(id, data);
      set((state) => ({
        interns: state.interns.map((i) => (i.id === id ? updated : i)),
        loading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  deleteIntern: async (id) => {
    set({ loading: true, error: null });
    try {
      await internService.deleteIntern(id);
      set((state) => ({
        interns: state.interns.filter((i) => i.id !== id),
        loading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
