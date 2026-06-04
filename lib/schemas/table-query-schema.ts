import { z } from "zod";

const sortOrderSchema = z.enum(["asc", "desc"]);

export function tableQuerySchema<
  const TSortColumns extends readonly [string, ...string[]],
>(allowedSortColumns: TSortColumns, defaultSortBy: TSortColumns[number]) {
  return z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    sortBy: z.enum(allowedSortColumns).default(defaultSortBy),
    sortOrder: sortOrderSchema.default("desc"),
    q: z.string().optional(),
  });
}
