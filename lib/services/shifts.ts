import { Shift } from "@/interfaces/models";
import { handleError } from "./utils";

export async function getShifts(limit = 1000): Promise<Shift[]> {
  const res = await fetch(`/api/shifts?limit=${limit}`);
  if (!res.ok) await handleError(res, "Gagal mengambil data shift");
  const json = await res.json();
  return json.data || [];
}

export async function createShift(name: string, workOnHolidays = false): Promise<Shift> {
  const res = await fetch("/api/shifts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, workOnHolidays }),
  });
  if (!res.ok) await handleError(res, "Gagal menambahkan shift");
  return res.json();
}

export async function updateShift(id: string, name: string, workOnHolidays?: boolean): Promise<Shift> {
  const res = await fetch(`/api/shifts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, workOnHolidays }),
  });
  if (!res.ok) await handleError(res, "Gagal memperbarui shift");
  return res.json();
}

export async function deleteShift(id: string): Promise<void> {
  const res = await fetch(`/api/shifts/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) await handleError(res, "Gagal menghapus shift");
}
