import { formatTimeToApi, formatTimeFromApi } from "@/lib/time-utils";
import { Schedule } from "@/interfaces/models";
import { handleError } from "./utils";

export async function getSchedules(limit = 1000): Promise<Schedule[]> {
  const res = await fetch(`/api/schedules?limit=${limit}`);
  if (!res.ok) await handleError(res, "Gagal mengambil data jadwal");
  const json = await res.json();
  const rawList: Schedule[] = json.data || [];
  return rawList.map((s) => ({
    ...s,
    windowStart: formatTimeFromApi(s.windowStart),
    scheduleStart: formatTimeFromApi(s.scheduleStart),
    lateCutoff: formatTimeFromApi(s.lateCutoff),
    scheduleEnd: formatTimeFromApi(s.scheduleEnd),
  }));
}

export async function createSchedule(data: Omit<Schedule, "id">): Promise<Schedule> {
  const payload = {
    ...data,
    windowStart: formatTimeToApi(data.windowStart),
    scheduleStart: formatTimeToApi(data.scheduleStart),
    lateCutoff: formatTimeToApi(data.lateCutoff),
    scheduleEnd: formatTimeToApi(data.scheduleEnd),
  };
  const res = await fetch("/api/schedules", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) await handleError(res, "Gagal menambahkan jadwal");
  const s = await res.json();
  return {
    ...s,
    windowStart: formatTimeFromApi(s.windowStart),
    scheduleStart: formatTimeFromApi(s.scheduleStart),
    lateCutoff: formatTimeFromApi(s.lateCutoff),
    scheduleEnd: formatTimeFromApi(s.scheduleEnd),
  };
}

export async function updateSchedule(
  id: string,
  data: Partial<Omit<Schedule, "id" | "shiftId">>
): Promise<Schedule> {
  const payload = {
    ...data,
    ...(data.windowStart ? { windowStart: formatTimeToApi(data.windowStart) } : {}),
    ...(data.scheduleStart ? { scheduleStart: formatTimeToApi(data.scheduleStart) } : {}),
    ...(data.lateCutoff ? { lateCutoff: formatTimeToApi(data.lateCutoff) } : {}),
    ...(data.scheduleEnd ? { scheduleEnd: formatTimeToApi(data.scheduleEnd) } : {}),
  };
  const res = await fetch(`/api/schedules/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) await handleError(res, "Gagal memperbarui jadwal");
  const s = await res.json();
  return {
    ...s,
    windowStart: formatTimeFromApi(s.windowStart),
    scheduleStart: formatTimeFromApi(s.scheduleStart),
    lateCutoff: formatTimeFromApi(s.lateCutoff),
    scheduleEnd: formatTimeFromApi(s.scheduleEnd),
  };
}

export async function deleteSchedule(id: string): Promise<void> {
  const res = await fetch(`/api/schedules/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) await handleError(res, "Gagal menghapus jadwal");
}
