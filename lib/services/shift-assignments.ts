import { ShiftAssignment } from "@/interfaces/models";
import { handleError } from "./utils";

/**
 * Fetches shift assignments with optional date range filtering.
 *
 * @param {number} [limit=1000] - Limit the number of returned records.
 * @param {string} [startDate] - Optional start date (YYYY-MM-DD) for filtering.
 * @param {string} [endDate] - Optional end date (YYYY-MM-DD) for filtering.
 * @returns {Promise<ShiftAssignment[]>} A promise that resolves to an array of shift assignments.
 */
export async function getShiftAssignments(
  limit = 1000,
  startDate?: string,
  endDate?: string,
): Promise<ShiftAssignment[]> {
  const params = new URLSearchParams();
  params.set("limit", String(limit));
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);

  const res = await fetch(`/api/shift-assignments?${params.toString()}`);
  if (!res.ok) await handleError(res, "Gagal mengambil data penugasan shift");
  const json = await res.json();
  return json.data || [];
}

export async function createShiftAssignment(
  data: Omit<ShiftAssignment, "id" | "user" | "shift">,
): Promise<ShiftAssignment> {
  const res = await fetch("/api/shift-assignments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) await handleError(res, "Gagal menambahkan penugasan shift");
  return res.json();
}

export async function updateShiftAssignment(
  id: string,
  data: Partial<Omit<ShiftAssignment, "id" | "userId" | "user" | "shift">>,
): Promise<ShiftAssignment> {
  const res = await fetch(`/api/shift-assignments/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) await handleError(res, "Gagal memperbarui penugasan shift");
  return res.json();
}

export async function deleteShiftAssignment(id: string): Promise<void> {
  const res = await fetch(`/api/shift-assignments/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) await handleError(res, "Gagal menghapus penugasan shift");
}
