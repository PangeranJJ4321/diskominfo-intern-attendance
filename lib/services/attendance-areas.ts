"use client";

import type { GeoJsonObject } from "geojson";
import type { AgencyArea } from "@/interfaces/models";
import { handleError } from "./utils";

/**
 * Fetches all agency areas.
 *
 * @param {number} [limit=1] - Limit the number of returned areas.
 * @returns {Promise<AgencyArea[]>} A promise resolving to an array of agency areas.
 */
export async function getAttendanceAreas(limit = 1): Promise<AgencyArea[]> {
  const res = await fetch(`/api/agencies/areas?limit=${limit}`);
  if (!res.ok) await handleError(res, "Gagal mengambil data area presensi");
  const json = await res.json();
  return json.data || [];
}

/**
 * Creates a new agency area (legacy wrapper).
 *
 * @param {GeoJsonObject} geoData - The GeoJSON boundary data.
 * @param {string} [timezone="Asia/Makassar"] - The timezone.
 * @returns {Promise<AgencyArea>} The created agency area.
 */
export async function createAttendanceArea(
  geoData: GeoJsonObject,
  timezone = "Asia/Makassar",
): Promise<AgencyArea> {
  const res = await fetch("/api/agencies/areas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ geoData, timezone }),
  });
  if (!res.ok) await handleError(res, "Gagal menambahkan area presensi");
  return res.json();
}

/**
 * Updates an existing agency area.
 *
 * @param {string} id - The area ID.
 * @param {GeoJsonObject} geoData - The GeoJSON boundary data.
 * @param {string} [timezone="Asia/Makassar"] - The timezone.
 * @returns {Promise<AgencyArea>} The updated agency area.
 */
export async function updateAttendanceArea(
  id: string,
  geoData: GeoJsonObject,
  timezone = "Asia/Makassar",
): Promise<AgencyArea> {
  const res = await fetch(`/api/agencies/areas/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ geoData, timezone }),
  });
  if (!res.ok) await handleError(res, "Gagal memperbarui area presensi");
  return res.json();
}
