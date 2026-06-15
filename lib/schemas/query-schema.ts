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

/**
 * Date range filter schema (YYYY-MM-DD strings).
 * Can be used standalone or merged with other query params.
 */
export const dateRangeSchema = z.object({
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "startDate must be YYYY-MM-DD")
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "endDate must be YYYY-MM-DD")
    .optional(),
});

/**
 * Combines a table query schema with optional date range filtering.
 * @param allowedSortColumns - Sortable column names.
 * @param defaultSort - Default sort column.
 * @param dateField - The field name for date range filtering. Defaults to "date".
 */
export function createDatedQuerySchema<T extends [string, ...string[]]>(
  allowedSortColumns: T,
  defaultSort: T[number],
) {
  return createTableQuerySchema(allowedSortColumns, defaultSort).merge(
    dateRangeSchema,
  );
}
