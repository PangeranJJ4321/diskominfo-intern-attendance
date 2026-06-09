import { ShiftAssignment } from "@/interfaces/models";
import { handleError } from "./utils";

export async function getShiftAssignments(limit = 1000): Promise<ShiftAssignment[]> {
  const res = await fetch(`/api/shift-assignments?limit=${limit}`);
  if (!res.ok) await handleError(res, "Gagal mengambil data penugasan shift");
  const json = await res.json();
  return json.data || [];
}

export async function createShiftAssignment(
  data: Omit<ShiftAssignment, "id" | "user" | "shift">
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
  data: Partial<Omit<ShiftAssignment, "id" | "userId" | "user" | "shift">>
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
