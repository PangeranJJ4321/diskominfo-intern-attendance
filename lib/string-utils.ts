/**
 * Extracts initials from a user's name for the avatar fallback.
 * e.g. "John Doe" → "JD", "Alice" → "A"
 * 
 * @param name The user's name
 * @returns Up to 2 capitalized letters representing initials
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");
}

/**
 * Generates a simple CUID-compatible string.
 * Zod's cuid regex is /^c[a-z0-9]{24}$/i.
 */
export function generateCuid(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "c";
  for (let i = 0; i < 24; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

