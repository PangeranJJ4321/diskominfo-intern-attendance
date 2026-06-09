import { Agency, AgencyRule } from "@/interfaces/models";
import type { AgencyArea } from "@/interfaces/models";
import type { GeoJsonObject } from "geojson";
import { handleError } from "./utils";

/**
 * Fetches all agencies.
 *
 * @param {number} [limit=1000] - Limit the number of returned agencies.
 * @returns {Promise<Agency[]>} A promise resolving to an array of agencies.
 */
export async function getAgencies(limit = 1000): Promise<Agency[]> {
  const res = await fetch(`/api/agencies?limit=${limit}`);
  if (!res.ok) await handleError(res, "Gagal mengambil data instansi");
  const json = await res.json();
  return json.data || [];
}

/**
 * Creates a new agency.
 *
 * @param {string} name - The agency name.
 * @returns {Promise<Agency>} The created agency.
 */
export async function createAgency(name: string): Promise<Agency> {
  const res = await fetch("/api/agencies", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) await handleError(res, "Gagal menambahkan instansi");
  return res.json();
}

/**
 * Updates an existing agency. At least one of `name` or `shiftId` must be provided.
 *
 * @param {string} id - The agency ID.
 * @param {string} [name] - The new agency name (optional).
 * @param {string} [shiftId] - The ID of the default shift for the agency (optional).
 * @returns {Promise<Agency>} The updated agency.
 */
export async function updateAgency(
  id: string,
  name?: string,
  shiftId?: string,
): Promise<Agency> {
  const body: Record<string, string> = {};
  if (name) body.name = name;
  if (shiftId) body.defaultShiftId = shiftId;
  const res = await fetch(`/api/agencies/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) await handleError(res, "Gagal memperbarui instansi");
  return res.json();
}

/**
 * Deletes an agency.
 *
 * @param {string} id - The agency ID.
 * @returns {Promise<void>} A promise resolving when deletion completes.
 */
export async function deleteAgency(id: string): Promise<void> {
  const res = await fetch(`/api/agencies/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) await handleError(res, "Gagal menghapus instansi");
}

/**
 * Fetches the AgencyRule for a specific agency (1:1 relationship).
 *
 * @param {string} agencyId - The agency ID.
 * @returns {Promise<AgencyRule>} The agency rule.
 */
export async function getAgencyRule(agencyId: string): Promise<AgencyRule> {
  const res = await fetch(`/api/agencies/${agencyId}/rules`);
  if (!res.ok) await handleError(res, "Gagal mengambil aturan instansi");
  return res.json();
}

/**
 * Creates an AgencyRule for a specific agency (1:1 relationship).
 *
 * @param {string} agencyId - The agency ID.
 * @param {object} data - The rule data (requireFaceVerification, requireWithinArea).
 * @returns {Promise<AgencyRule>} The created agency rule.
 */
export async function createAgencyRule(
  agencyId: string,
  data: { requireFaceVerification?: boolean; requireWithinArea?: boolean },
): Promise<AgencyRule> {
  const res = await fetch(`/api/agencies/${agencyId}/rules`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) await handleError(res, "Gagal menambahkan aturan instansi");
  return res.json();
}

/**
 * Updates an AgencyRule for a specific agency (1:1 relationship).
 *
 * @param {string} agencyId - The agency ID.
 * @param {object} data - The rule data to update.
 * @returns {Promise<AgencyRule>} The updated agency rule.
 */
export async function updateAgencyRule(
  agencyId: string,
  data: { requireFaceVerification?: boolean; requireWithinArea?: boolean },
): Promise<AgencyRule> {
  const res = await fetch(`/api/agencies/${agencyId}/rules`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) await handleError(res, "Gagal memperbarui aturan instansi");
  return res.json();
}

/**
 * Deletes an AgencyRule for a specific agency.
 *
 * @param {string} agencyId - The agency ID.
 * @returns {Promise<void>} A promise resolving when deletion completes.
 */
export async function deleteAgencyRule(agencyId: string): Promise<void> {
  const res = await fetch(`/api/agencies/${agencyId}/rules`, {
    method: "DELETE",
  });
  if (!res.ok) await handleError(res, "Gagal menghapus aturan instansi");
}

/**
 * Fetches the AgencyArea for a specific agency (1:1 relationship).
 *
 * @param {string} agencyId - The agency ID.
 * @returns {Promise<AttendanceArea>} The agency area.
 */
export async function getAgencyArea(agencyId: string): Promise<AgencyArea> {
  const res = await fetch(`/api/agencies/${agencyId}/areas`);
  if (!res.ok) await handleError(res, "Gagal mengambil area instansi");
  return res.json();
}

/**
 * Creates an AgencyArea for a specific agency (1:1 relationship).
 *
 * @param {string} agencyId - The agency ID.
 * @param {GeoJsonObject} geoData - The GeoJSON boundary data.
 * @param {string} [timezone="Asia/Makassar"] - The timezone.
 * @returns {Promise<AttendanceArea>} The created agency area.
 */
export async function createAgencyArea(
  agencyId: string,
  geoData: GeoJsonObject,
  timezone = "Asia/Makassar",
): Promise<AgencyArea> {
  const res = await fetch(`/api/agencies/${agencyId}/areas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ geoData, timezone }),
  });
  if (!res.ok) await handleError(res, "Gagal menambahkan area instansi");
  return res.json();
}

/**
 * Updates an AgencyArea for a specific agency (1:1 relationship).
 *
 * @param {string} agencyId - The agency ID.
 * @param {GeoJsonObject} geoData - The GeoJSON boundary data.
 * @param {string} [timezone="Asia/Makassar"] - The timezone.
 * @returns {Promise<AttendanceArea>} The updated agency area.
 */
export async function updateAgencyArea(
  agencyId: string,
  geoData: GeoJsonObject,
  timezone = "Asia/Makassar",
): Promise<AgencyArea> {
  const res = await fetch(`/api/agencies/${agencyId}/areas`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ geoData, timezone }),
  });
  if (!res.ok) await handleError(res, "Gagal memperbarui area instansi");
  return res.json();
}

/**
 * Deletes an AgencyArea for a specific agency.
 *
 * @param {string} agencyId - The agency ID.
 * @returns {Promise<void>} A promise resolving when deletion completes.
 */
export async function deleteAgencyArea(agencyId: string): Promise<void> {
  const res = await fetch(`/api/agencies/${agencyId}/areas`, {
    method: "DELETE",
  });
  if (!res.ok) await handleError(res, "Gagal menghapus area instansi");
}
