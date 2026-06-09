// lib/schemas/shift-schema.ts
import { z } from "zod";

export const createShiftSchema = z.object({
  name: z.string().min(1, "Nama shift wajib diisi."),
  workOnHolidays: z.boolean().optional(),
});

export const updateShiftSchema = createShiftSchema.partial();
