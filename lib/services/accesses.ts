"use client";

import type { AgencyAccess } from "@/interfaces/models";
import { handleError } from "./utils";

/**
 * Fetches all agency accesses with their related user and agency data.
 * (Alias for getAgencyAccesses to support legacy import paths)
 *
 * @param {number} [limit=1000] - Limit the number of returned accesses.
 * @returns {Promise<AgencyAccess[]>} A promise resolving to an array of agency accesses.
 */
export async function getAccesses(limit = 1000): Promise<AgencyAccess[]> {
  const res = await fetch(`/api/agency-accesses?limit=${limit}`);
  if (!res.ok) await handleError(res, "Gagal mengambil data akses instansi");
  const json = await res.json();
  return json.data || [];
}

/**
 * Creates a new agency access.
 *
 * @param {string} agencyId - The agency ID.
 * @param {string} userId - The user ID.
 * @returns {Promise<AgencyAccess>} The created agency access.
 */
export async function createAccess(
  agencyId: string,
  userId: string,
): Promise<AgencyAccess> {
  const res = await fetch("/api/agency-accesses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agencyId, userId }),
  });
  if (!res.ok) await handleError(res, "Gagal menambahkan akses instansi");
  return res.json();
}

/**
 * Deletes an agency access.
 *
 * @param {string} id - The access ID.
 * @returns {Promise<void>} A promise resolving when deletion completes.
 */
export async function deleteAccess(id: string): Promise<void> {
  const res = await fetch(`/api/agency-accesses/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) await handleError(res, "Gagal menghapus akses instansi");
}
