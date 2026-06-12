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

/**
 * Truncates a time string to the HH:mm label format used in the UI.
 * Accepts both "HH:mm" and "HH:mm:ss" inputs.
 *
 * @param value - The time string to format.
 * @returns The truncated HH:mm string.
 */
export function formatTimeLabel(value: string): string {
  return value.length >= 5 ? value.slice(0, 5) : value;
}
