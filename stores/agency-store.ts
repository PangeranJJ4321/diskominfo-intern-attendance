"use client";

import { create } from "zustand";
import type { Agency, AgencyRule } from "@/interfaces/models";
import { getAgencies, getAgencyRule } from "@/lib/services/agencies";

interface AgencyState {
  agencies: Agency[];
  loading: boolean;
  ruleCache: Record<string, AgencyRule | null>;
  /** Fetches all agencies from the API and populates the store. */
  fetchAgencies: (limit?: number) => Promise<void>;
  /** Resolves the agencyId for a given agency name (case-insensitive). */
  getAgencyIdByName: (name: string) => string | undefined;
  /** Returns an agency by its ID */
  getAgencyById: (id: string) => Agency | undefined;
  /** Fetches and caches the agency rule for a given agency ID. */
  fetchAgencyRule: (agencyId: string) => Promise<AgencyRule | null>;
  /** Returns the cached agency rule if available. */
  getCachedRule: (agencyId: string) => AgencyRule | null | undefined;
  /** Appends an agency to the store optimistically after a successful create. */
  addAgency: (agency: Agency) => void;
  /** Replaces an existing agency in the store after a successful update. */
  updateAgency: (updated: Agency) => void;
  /** Removes an agency from the store after a successful deletion. */
  removeAgency: (id: string) => void;
}

/**
 * Zustand store holding agency records.
 * Components subscribe to `agencies` and call `fetchAgencies` on mount.
 *
 * Provides helper methods to resolve agency IDs by name, and caches
 * agency rules on demand to reduce redundant API calls across
 * dashboard and admin components.
 */
export const useAgencyStore = create<AgencyState>((set, get) => ({
  agencies: [],
  loading: false,
  ruleCache: {},

  fetchAgencies: async (limit = 1000) => {
    set({ loading: true });
    try {
      const data = await getAgencies(limit);
      set({ agencies: data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  getAgencyIdByName: (name: string) => {
    const { agencies } = get();
    const match = agencies.find(
      (a) => a.name.toLowerCase() === name.toLowerCase(),
    );
    return match?.id;
  },

  getAgencyById: (id: string) => {
    const { agencies } = get();
    return agencies.find((a) => a.id === id);
  },

  fetchAgencyRule: async (agencyId: string) => {
    try {
      const rule = await getAgencyRule(agencyId);
      set((state) => ({
        ruleCache: { ...state.ruleCache, [agencyId]: rule },
      }));
      return rule;
    } catch {
      set((state) => ({
        ruleCache: { ...state.ruleCache, [agencyId]: null },
      }));
      return null;
    }
  },

  getCachedRule: (agencyId: string) => {
    const { ruleCache } = get();
    return ruleCache[agencyId];
  },

  addAgency: (agency) =>
    set((state) => ({ agencies: [...state.agencies, agency] })),

  updateAgency: (updated) =>
    set((state) => ({
      agencies: state.agencies.map((a) => (a.id === updated.id ? updated : a)),
    })),

  removeAgency: (id) =>
    set((state) => ({
      agencies: state.agencies.filter((a) => a.id !== id),
    })),
}));
