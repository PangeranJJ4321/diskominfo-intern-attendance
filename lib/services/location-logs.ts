import { LocationLog } from "@/interfaces/models";
import { handleError } from "./utils";

/**
 * Fetches location logs with optional date range filtering.
 *
 * @param {number} [limit=1000] - Limit the number of returned records.
 * @param {string} [startDate] - Optional start date (YYYY-MM-DD) for filtering.
 * @param {string} [endDate] - Optional end date (YYYY-MM-DD) for filtering.
 * @returns {Promise<LocationLog[]>} A promise that resolves to an array of location logs.
 */
export async function getLocationLogs(
  limit = 1000,
  startDate?: string,
  endDate?: string,
): Promise<LocationLog[]> {
  const params = new URLSearchParams();
  params.set("limit", String(limit));
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);

  const res = await fetch(`/api/location-logs?${params.toString()}`);
  if (!res.ok) await handleError(res, "Gagal mengambil data log lokasi");
  const json = await res.json();
  return json.data || [];
}

/**
 * Creates a new location log entry for a user.
 *
 * @param data - The location log data including userId, latitude, and longitude.
 * @returns The created LocationLog.
 */
export async function createLocationLog(data: {
  userId: string;
  latitude: number;
  longitude: number;
}): Promise<LocationLog> {
  const res = await fetch("/api/location-logs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) await handleError(res, "Gagal membuat log lokasi");
  return res.json();
}
