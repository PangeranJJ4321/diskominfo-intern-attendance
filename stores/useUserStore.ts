"use client";

import { create } from "zustand";
import type { User, ProfileUser } from "@/interfaces/models";
import * as userService from "@/lib/services/users";

/** State shape for the user store */
interface UserState {
  /** All users (list view) */
  users: User[];
  /** Currently selected detailed user profile */
  profile: ProfileUser | null;
  /** Whether a fetch operation is in progress */
  loading: boolean;
  /** Latest error message, if any */
  error: string | null;
}

/** Actions exposed by the user store */
interface UserActions {
  /** Fetch all users into `users` */
  fetchUsers: (limit?: number) => Promise<void>;
  /** Fetch a single user profile by ID */
  fetchUser: (userId: string) => Promise<void>;
  /** Update a user profile */
  updateUser: (
    userId: string,
    data: Partial<Omit<ProfileUser, "id" | "accounts" | "faceDescriptors">>,
  ) => Promise<void>;
  /** Delete a user */
  deleteUser: (userId: string) => Promise<void>;
  /** Add a face descriptor for a user */
  addFaceDescriptor: (userId: string, descriptor: number[]) => Promise<void>;
  /** Delete all face descriptors for a user */
  deleteFaceDescriptors: (userId: string) => Promise<void>;
  /** Unlink an external auth provider account */
  unlinkAccount: (userId: string, providerId: string) => Promise<void>;
  /** Clear the error state */
  clearError: () => void;
}

export const useUserStore = create<UserState & UserActions>((set) => ({
  users: [],
  profile: null,
  loading: false,
  error: null,

  fetchUsers: async (limit = 1000) => {
    set({ loading: true, error: null });
    try {
      const users = await userService.getUsers(limit);
      set({ users, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  fetchUser: async (userId) => {
    set({ loading: true, error: null });
    try {
      const profile = await userService.fetchUser(userId);
      set({ profile, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  updateUser: async (userId, data) => {
    set({ loading: true, error: null });
    try {
      const profile = await userService.updateUser(userId, data);
      set({ profile, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  deleteUser: async (userId) => {
    set({ loading: true, error: null });
    try {
      await userService.deleteUser(userId);
      set((state) => ({
        users: state.users.filter((u) => u.id !== userId),
        profile: state.profile?.id === userId ? null : state.profile,
        loading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  addFaceDescriptor: async (userId, descriptor) => {
    set({ loading: true, error: null });
    try {
      const profile = await userService.addFaceDescriptor(userId, descriptor);
      set({ profile, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  deleteFaceDescriptors: async (userId) => {
    set({ loading: true, error: null });
    try {
      const profile = await userService.deleteFaceDescriptors(userId);
      set({ profile, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  unlinkAccount: async (userId, providerId) => {
    set({ loading: true, error: null });
    try {
      const profile = await userService.unlinkAccount(userId, providerId);
      set({ profile, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
