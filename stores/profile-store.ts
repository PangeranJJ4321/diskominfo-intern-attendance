"use client";

import { create } from "zustand";
import type { ProfileUser } from "@/interfaces/models";
import { fetchUser } from "@/lib/services/users";

/** State shape for the profile store */
interface ProfileState {
  /** The currently loaded user profile, or null if not yet fetched */
  user: ProfileUser | null;
  /** Whether the profile data is still being loaded */
  loading: boolean;
  /** Fetch user profile from the backend for the given user ID */
  fetchProfile: (userId: string) => Promise<void>;
  /** Replace the stored user profile (used after edits / updates) */
  updateUser: (updatedUser: ProfileUser) => void;
  /** Reset the store back to its initial state */
  reset: () => void;
}

/**
 * Zustand store holding the current user's profile data.
 * Shared by the profile page and its child components to avoid
 * prop drilling and local state management.
 */
export const useProfileStore = create<ProfileState>((set) => ({
  user: null,
  loading: true,

  fetchProfile: async (userId: string) => {
    set({ loading: true });
    try {
      const data = await fetchUser(userId);
      set({ user: data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  updateUser: (updatedUser: ProfileUser) => {
    set({ user: updatedUser });
  },

  reset: () => {
    set({ user: null, loading: true });
  },
}));
