"use client";

import { create } from "zustand";
import type { Agency, AgencyRule, AgencyArea } from "@/interfaces/models";
import type { GeoJsonObject } from "geojson";
import * as agencyService from "@/lib/services/agencies";

/** State shape for the agency store */
interface AgencyState {
  /** All agencies */
  agencies: Agency[];
  /** Agency rule for the currently focused agency */
  rule: AgencyRule | null;
  /** Agency area for the currently focused agency */
  area: AgencyArea | null;
  /** Whether a fetch operation is in progress */
  loading: boolean;
  /** Latest error message, if any */
  error: string | null;
}

/** Actions exposed by the agency store */
interface AgencyActions {
  /** Fetch all agencies */
  fetchAgencies: (limit?: number) => Promise<void>;
  /** Create a new agency */
  createAgency: (name: string) => Promise<void>;
  /** Update an existing agency */
  updateAgency: (id: string, name?: string, shiftId?: string) => Promise<void>;
  /** Delete an agency */
  deleteAgency: (id: string) => Promise<void>;
  /** Fetch agency rule for a specific agency */
  fetchAgencyRule: (agencyId: string) => Promise<void>;
  /** Create agency rule for a specific agency */
  createAgencyRule: (
    agencyId: string,
    data: { requireFaceVerification?: boolean; requireWithinArea?: boolean },
  ) => Promise<void>;
  /** Update agency rule for a specific agency */
  updateAgencyRule: (
    agencyId: string,
    data: { requireFaceVerification?: boolean; requireWithinArea?: boolean },
  ) => Promise<void>;
  /** Delete agency rule for a specific agency */
  deleteAgencyRule: (agencyId: string) => Promise<void>;
  /** Fetch agency area for a specific agency */
  fetchAgencyArea: (agencyId: string) => Promise<void>;
  /** Create agency area for a specific agency */
  createAgencyArea: (
    agencyId: string,
    geoData: GeoJsonObject,
    timezone?: string,
  ) => Promise<void>;
  /** Update agency area for a specific agency */
  updateAgencyArea: (
    agencyId: string,
    geoData: GeoJsonObject,
    timezone?: string,
  ) => Promise<void>;
  /** Delete agency area for a specific agency */
  deleteAgencyArea: (agencyId: string) => Promise<void>;
  /** Clear the error state */
  clearError: () => void;
}

export const useAgencyStore = create<AgencyState & AgencyActions>((set) => ({
  agencies: [],
  rule: null,
  area: null,
  loading: false,
  error: null,

  fetchAgencies: async (limit = 1000) => {
    set({ loading: true, error: null });
    try {
      const agencies = await agencyService.getAgencies(limit);
      set({ agencies, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  createAgency: async (name) => {
    set({ loading: true, error: null });
    try {
      const agency = await agencyService.createAgency(name);
      set((state) => ({
        agencies: [...state.agencies, agency],
        loading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  updateAgency: async (id, name, shiftId) => {
    set({ loading: true, error: null });
    try {
      const updated = await agencyService.updateAgency(id, name, shiftId);
      set((state) => ({
        agencies: state.agencies.map((a) => (a.id === id ? updated : a)),
        loading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  deleteAgency: async (id) => {
    set({ loading: true, error: null });
    try {
      await agencyService.deleteAgency(id);
      set((state) => ({
        agencies: state.agencies.filter((a) => a.id !== id),
        loading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  fetchAgencyRule: async (agencyId) => {
    set({ loading: true, error: null });
    try {
      const rule = await agencyService.getAgencyRule(agencyId);
      set({ rule, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  createAgencyRule: async (agencyId, data) => {
    set({ loading: true, error: null });
    try {
      const rule = await agencyService.createAgencyRule(agencyId, data);
      set({ rule, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  updateAgencyRule: async (agencyId, data) => {
    set({ loading: true, error: null });
    try {
      const rule = await agencyService.updateAgencyRule(agencyId, data);
      set({ rule, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  deleteAgencyRule: async (agencyId) => {
    set({ loading: true, error: null });
    try {
      await agencyService.deleteAgencyRule(agencyId);
      set({ rule: null, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  fetchAgencyArea: async (agencyId) => {
    set({ loading: true, error: null });
    try {
      const area = await agencyService.getAgencyArea(agencyId);
      set({ area, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  createAgencyArea: async (agencyId, geoData, timezone = "Asia/Makassar") => {
    set({ loading: true, error: null });
    try {
      const area = await agencyService.createAgencyArea(
        agencyId,
        geoData,
        timezone,
      );
      set({ area, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  updateAgencyArea: async (agencyId, geoData, timezone = "Asia/Makassar") => {
    set({ loading: true, error: null });
    try {
      const area = await agencyService.updateAgencyArea(
        agencyId,
        geoData,
        timezone,
      );
      set({ area, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  deleteAgencyArea: async (agencyId) => {
    set({ loading: true, error: null });
    try {
      await agencyService.deleteAgencyArea(agencyId);
      set({ area: null, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
