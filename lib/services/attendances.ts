import { Attendance } from "@/interfaces/models";
import { handleError } from "./utils";

export async function getAttendances(limit = 1000): Promise<Attendance[]> {
  const res = await fetch(`/api/attendances?limit=${limit}`);
  if (!res.ok) await handleError(res, "Gagal mengambil data presensi");
  const json = await res.json();
  return json.data || [];
}

export async function getAttendancesForUser(
  userId: string,
  limit = 1000,
): Promise<Attendance[]> {
  const res = await fetch(`/api/users/${userId}/attendances?limit=${limit}`);
  if (!res.ok) await handleError(res, "Gagal mengambil presensi pengguna");
  const json = await res.json();
  const rawList = json.data || [];
  return rawList.map((a: Attendance) => {
    let cleanTime = a.attendanceTime;
    if (cleanTime && cleanTime.includes("T")) {
      const dateObj = new Date(cleanTime);
      const hours = String(dateObj.getHours()).padStart(2, "0");
      const minutes = String(dateObj.getMinutes()).padStart(2, "0");
      cleanTime = `${hours}:${minutes}`;
    }
    return {
      ...a,
      attendanceTime: cleanTime,
    };
  });
}

export async function createAttendance(
  data: Omit<Attendance, "id">,
): Promise<Attendance> {
  const res = await fetch("/api/attendances", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) await handleError(res, "Gagal mencatat presensi");
  return res.json();
}

export async function updateAttendance(
  id: string,
  data: Partial<Omit<Attendance, "id">>,
): Promise<Attendance> {
  const res = await fetch(`/api/attendances/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) await handleError(res, "Gagal memperbarui presensi");
  return res.json();
}
