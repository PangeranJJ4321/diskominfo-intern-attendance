"use client";

import { authClient } from "@/lib/auth-client";
import { User, ProfileUser } from "@/interfaces/models";
import { handleError } from "./utils";

/**
 * Fetches all users from the backend API.
 *
 * @param {number} [limit=1000] - Limit the number of returned users.
 * @returns {Promise<User[]>} A promise that resolves to an array of users.
 */
export async function getUsers(limit = 1000): Promise<User[]> {
  const res = await fetch(`/api/users?limit=${limit}`);
  if (!res.ok) await handleError(res, "Gagal mengambil data pengguna");
  const json = await res.json();
  return json.data || [];
}

/**
 * Fetches a single user with accounts and face descriptors.
 *
 * @param {string} userId - The ID of the user to fetch.
 * @returns {Promise<ProfileUser>} The detailed user profile.
 */
export async function fetchUser(userId: string): Promise<ProfileUser> {
  const res = await fetch(
    `/api/users/${userId}?include=accounts,faceDescriptors`,
  );
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch user profile data");
  }
  const data = await res.json();

  return {
    ...data,
    role:
      data.agencyAccesses && data.agencyAccesses.length > 0 ? "ADMIN" : "USER",
    accounts: data.accounts || [],
    faceDescriptors: data.faceDescriptors || [],
  };
}

/**
 * Updates a user's profile information.
 *
 * @param {string} userId - The ID of the user.
 * @param {Partial<Omit<ProfileUser, "id" | "accounts" | "faceDescriptors">> } data - The fields to update.
 * @returns {Promise<ProfileUser>} The updated user profile.
 */
export async function updateUser(
  userId: string,
  data: Partial<Omit<ProfileUser, "id" | "accounts" | "faceDescriptors">>,
): Promise<ProfileUser> {
  const res = await fetch(`/api/users/${userId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to update profile info");
  }
  return fetchUser(userId);
}

/**
 * Deletes a user account.
 *
 * @param {string} userId - The ID of the user to delete.
 * @returns {Promise<void>} A promise resolving when the deletion is complete.
 */
export async function deleteUser(userId: string): Promise<void> {
  const res = await fetch(`/api/users/${userId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to delete account");
  }
}

/**
 * Adds a face descriptor for a user.
 *
 * @param {string} userId - The ID of the user.
 * @param {number[]} descriptor - The numerical face descriptor values.
 * @returns {Promise<ProfileUser>} The updated user profile.
 */
export async function addFaceDescriptor(
  userId: string,
  descriptor: number[],
): Promise<ProfileUser> {
  const res = await fetch(`/api/users/${userId}/face-descriptors`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ descriptor }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to register face descriptor");
  }
  return fetchUser(userId);
}

/**
 * Deletes all registered face descriptors for a user.
 *
 * @param {string} userId - The ID of the user.
 * @returns {Promise<ProfileUser>} The updated user profile.
 */
export async function deleteFaceDescriptors(
  userId: string,
): Promise<ProfileUser> {
  const res = await fetch(`/api/users/${userId}/face-descriptors`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to clear face descriptors");
  }
  return fetchUser(userId);
}

/**
 * Unlinks an external auth provider account from the user.
 *
 * @param {string} userId - The ID of the user.
 * @param {string} providerId - The provider ID to unlink (e.g. google, github).
 * @returns {Promise<ProfileUser>} The updated user profile.
 */
export async function unlinkAccount(
  userId: string,
  providerId: string,
): Promise<ProfileUser> {
  const { error } = await authClient.unlinkAccount({
    providerId: providerId as Parameters<
      typeof authClient.unlinkAccount
    >[0]["providerId"],
  });
  if (error) {
    throw new Error(
      error.message || `Failed to disconnect ${providerId} account`,
    );
  }
  return fetchUser(userId);
}

/**
 * Fetches the registered face descriptors for a user.
 *
 * @param {string} userId - The ID of the user.
 * @returns {Promise<{ data: { id: string; descriptor: number[] }[] }>} The face descriptors response.
 */
export async function getUserFaceDescriptors(userId: string) {
  const res = await fetch(`/api/users/${userId}/face-descriptors`);
  if (!res.ok) await handleError(res, "Gagal mengambil data deskriptor wajah");
  return res.json();
}
