import { Intern } from "@/interfaces/models";
import { handleError } from "./utils";

/**
 * Fetches all interns with their related user, agency, and institution data.
 *
 * @param {number} [limit=1000] - Limit the number of returned interns.
 * @returns {Promise<Intern[]>} A promise resolving to an array of interns.
 */
export async function getInterns(limit = 1000): Promise<Intern[]> {
  const res = await fetch(`/api/interns?limit=${limit}`);
  if (!res.ok) await handleError(res, "Gagal mengambil data magang");
  const json = await res.json();
  return json.data || [];
}

/**
 * Creates a new intern record.
 *
 * @param {Omit<Intern, "id" | "user" | "agency" | "institution" | "createdAt" | "updatedAt">} data - The intern data.
 * @returns {Promise<Intern>} The created intern.
 */
export async function createIntern(
  data: Omit<
    Intern,
    "id" | "user" | "agency" | "institution" | "createdAt" | "updatedAt"
  >,
): Promise<Intern> {
  const res = await fetch("/api/interns", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) await handleError(res, "Gagal menambahkan data magang");
  return res.json();
}

/**
 * Updates an existing intern record.
 *
 * @param {string} id - The intern ID.
 * @param {Partial<Omit<Intern, "id" | "user" | "agency" | "institution" | "createdAt" | "updatedAt">>} data - The data to update.
 * @returns {Promise<Intern>} The updated intern.
 */
export async function updateIntern(
  id: string,
  data: Partial<
    Omit<
      Intern,
      "id" | "user" | "agency" | "institution" | "createdAt" | "updatedAt"
    >
  >,
): Promise<Intern> {
  const res = await fetch(`/api/interns/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) await handleError(res, "Gagal memperbarui data magang");
  return res.json();
}

/**
 * Deletes an intern record.
 *
 * @param {string} id - The intern ID.
 * @returns {Promise<void>} A promise resolving when deletion completes.
 */
export async function deleteIntern(id: string): Promise<void> {
  const res = await fetch(`/api/interns/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) await handleError(res, "Gagal menghapus data magang");
}
