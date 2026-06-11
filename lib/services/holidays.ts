import { AgencyHoliday } from "@/interfaces/models";
import { handleError } from "./utils";

/**
 * Fetches holidays with optional date range filtering.
 *
 * @param {number} [limit=1000] - Limit the number of returned records.
 * @param {string} [startDate] - Optional start date (YYYY-MM-DD) for filtering.
 * @param {string} [endDate] - Optional end date (YYYY-MM-DD) for filtering.
 * @returns {Promise<AgencyHoliday[]>} A promise that resolves to an array of AgencyHoliday.
 */
export async function getHolidays(
  limit = 1000,
  startDate?: string,
  endDate?: string,
): Promise<AgencyHoliday[]> {
  const params = new URLSearchParams();
  params.set("limit", String(limit));
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);

  const res = await fetch(`/api/holidays?${params.toString()}`);
  if (!res.ok) await handleError(res, "Gagal mengambil data libur");
  const json = await res.json();
  return json.data || [];
}

export async function createHoliday(
  data: Omit<AgencyHoliday, "id">,
): Promise<AgencyHoliday> {
  const res = await fetch("/api/holidays", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) await handleError(res, "Gagal menambahkan hari libur");
  return res.json();
}

export async function updateHoliday(
  id: string,
  data: Partial<Omit<AgencyHoliday, "id">>,
): Promise<AgencyHoliday> {
  const res = await fetch(`/api/holidays/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) await handleError(res, "Gagal memperbarui hari libur");
  return res.json();
}

export async function deleteHoliday(id: string): Promise<void> {
  const res = await fetch(`/api/holidays/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) await handleError(res, "Gagal menghapus hari libur");
}
