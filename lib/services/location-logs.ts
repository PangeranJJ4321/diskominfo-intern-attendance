import { LocationLog } from "@/interfaces/models";
import { handleError } from "./utils";

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
