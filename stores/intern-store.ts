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
  /** Returns the first intern record for a given userId. */
  getInternForUser: (userId: string) => Intern | undefined;
  /** Appends an intern to the store optimistically after a successful create. */
  addIntern: (intern: Intern) => void;
  /** Replaces an existing intern in the store after a successful update. */
  updateIntern: (updated: Intern) => void;
  /** Removes an intern from the store after a successful deletion. */
  removeIntern: (id: string) => void;
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

  getInternForUser: (userId: string) => {
    const { interns } = get();
    return interns.find((i) => i.userId === userId);
  },

  addIntern: (intern) =>
    set((state) => ({ interns: [...state.interns, intern] })),

  updateIntern: (updated) =>
    set((state) => ({
      interns: state.interns.map((i) => (i.id === updated.id ? updated : i)),
    })),

  removeIntern: (id) =>
    set((state) => ({
      interns: state.interns.filter((i) => i.id !== id),
    })),
}));
