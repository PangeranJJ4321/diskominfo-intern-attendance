import { Holiday } from "@/interfaces/models";
import { handleError } from "./utils";

export async function getHolidays(limit = 1000): Promise<Holiday[]> {
  const res = await fetch(`/api/holidays?limit=${limit}`);
  if (!res.ok) await handleError(res, "Gagal mengambil data libur");
  const json = await res.json();
  return json.data || [];
}

export async function createHoliday(data: Omit<Holiday, "id">): Promise<Holiday> {
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
  data: Partial<Omit<Holiday, "id">>
): Promise<Holiday> {
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
