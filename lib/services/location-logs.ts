import { LocationLog } from "@/interfaces/models";
import { handleError } from "./utils";

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
