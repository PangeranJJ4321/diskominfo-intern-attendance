//lib/schemas/query-schema.ts
import { z } from "zod";

// Base schema for global pagination and fallback search
export const baseQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  search: z.string().optional(),
});

/**
 * Helper function to generate a specific table schema dynamically.
 * This injects custom column sorting options while inheriting standard pagination.
 */
export function createTableQuerySchema<T extends [string, ...string[]]>(
  allowedSortColumns: T,
  defaultSort: T[number],
) {
  return baseQuerySchema.extend({
    sortBy: z.enum(allowedSortColumns).default(defaultSort) as z.ZodType<
      T[number]
    >,
  });
}
