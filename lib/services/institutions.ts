import { Institution } from "@/interfaces/models";
import { handleError } from "./utils";

/**
 * Fetches all institutions.
 *
 * @param {number} [limit=1000] - Limit the number of returned institutions.
 * @returns {Promise<Institution[]>} A promise resolving to an array of institutions.
 */
export async function getInstitutions(limit = 1000): Promise<Institution[]> {
  const res = await fetch(`/api/institutions?limit=${limit}`);
  if (!res.ok) await handleError(res, "Gagal mengambil data institusi");
  const json = await res.json();
  return json.data || [];
}

/**
 * Creates a new institution.
 *
 * @param {string} name - The institution name.
 * @returns {Promise<Institution>} The created institution.
 */
export async function createInstitution(name: string): Promise<Institution> {
  const res = await fetch("/api/institutions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) await handleError(res, "Gagal menambahkan institusi");
  return res.json();
}

/**
 * Updates an existing institution.
 *
 * @param {string} id - The institution ID.
 * @param {string} name - The new institution name.
 * @returns {Promise<Institution>} The updated institution.
 */
export async function updateInstitution(
  id: string,
  name: string,
): Promise<Institution> {
  const res = await fetch(`/api/institutions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) await handleError(res, "Gagal memperbarui institusi");
  return res.json();
}

/**
 * Deletes an institution.
 *
 * @param {string} id - The institution ID.
 * @returns {Promise<void>} A promise resolving when deletion completes.
 */
export async function deleteInstitution(id: string): Promise<void> {
  const res = await fetch(`/api/institutions/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) await handleError(res, "Gagal menghapus institusi");
}
