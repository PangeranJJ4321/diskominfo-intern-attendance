import { AttendanceArea } from "@/interfaces/models";
import type { GeoJsonObject } from "geojson";
import { handleError } from "./utils";

export async function getAttendanceAreas(limit = 1000): Promise<AttendanceArea[]> {
  const res = await fetch(`/api/attendance-areas?limit=${limit}`);
  if (!res.ok) await handleError(res, "Gagal mengambil area presensi");
  const json = await res.json();
  return json.data || [];
}

export async function createAttendanceArea(
  geoData: GeoJsonObject,
  timezone = "Asia/Makassar"
): Promise<AttendanceArea> {
  const res = await fetch("/api/attendance-areas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ geoData, timezone }),
  });
  if (!res.ok) await handleError(res, "Gagal membuat area presensi");
  return res.json();
}

export async function updateAttendanceArea(
  id: string,
  geoData: GeoJsonObject,
  timezone = "Asia/Makassar"
): Promise<AttendanceArea> {
  const res = await fetch(`/api/attendance-areas/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ geoData, timezone }),
  });
  if (!res.ok) await handleError(res, "Gagal memperbarui area presensi");
  return res.json();
}
