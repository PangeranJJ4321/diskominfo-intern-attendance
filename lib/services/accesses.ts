import { AdminAccess } from "@/interfaces/models";
import { handleError } from "./utils";

export async function getAccesses(limit = 1000): Promise<AdminAccess[]> {
  const res = await fetch(`/api/accesses?limit=${limit}`);
  if (!res.ok) await handleError(res, "Gagal mengambil data akses");
  const json = await res.json();
  return json.data || [];
}

export async function createAccess(userId: string): Promise<AdminAccess> {
  const res = await fetch("/api/accesses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) await handleError(res, "Gagal menambahkan akses");
  return res.json();
}

export async function deleteAccess(id: string): Promise<void> {
  const res = await fetch(`/api/accesses/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) await handleError(res, "Gagal menghapus akses");
}
