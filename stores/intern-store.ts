"use client";

import { create } from "zustand";
import type { Intern } from "@/interfaces/models";
import { getInterns } from "@/lib/services/interns";

interface InternState {
  interns: Intern[];
  loading: boolean;
  /** Fetches all interns from the API and populates the store. */
  fetchInterns: (limit?: number) => Promise<void>;
  /** Resolves the internId for a given userId and optional agencyId. */
  getInternIdForUser: (userId: string, agencyId?: string) => string | undefined;
  /** Returns all intern records for a given userId. */
  getInternsForUser: (userId: string) => Intern[];
}

/**
 * Zustand store holding intern records.
 * Components subscribe to `interns` and call `fetchInterns` on mount.
 *
 * Provides helper methods to resolve intern IDs for a given user,
 * which is essential since attendance and shift assignments are
 * tied to Intern (not User) in the data model.
 */
export const useInternStore = create<InternState>((set, get) => ({
  interns: [],
  loading: false,

  fetchInterns: async (limit = 1000) => {
    set({ loading: true });
    try {
      const data = await getInterns(limit);
      set({ interns: data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  getInternIdForUser: (userId: string, agencyId?: string) => {
    const { interns } = get();
    const match = interns.find(
      (i) => i.userId === userId && (agencyId ? i.agencyId === agencyId : true),
    );
    return match?.id;
  },

  getInternsForUser: (userId: string) => {
    const { interns } = get();
    return interns.filter((i) => i.userId === userId);
  },
}));
