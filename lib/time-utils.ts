// Time format mapping helpers: API expects HH:mm:ss, UI uses HH:mm
export function formatTimeToApi(time: string): string {
  if (!time) return time;
  if (time.length === 5) return `${time}:00`;
  return time;
}

export function formatTimeFromApi(time: string): string {
  if (!time) return time;
  if (time.length === 8) return time.slice(0, 5);
  return time;
}
