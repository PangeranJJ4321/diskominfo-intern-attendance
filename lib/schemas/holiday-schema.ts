// lib/schemas/holiday-schema.ts
import { z } from "zod";

export const createHolidaySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD."),
  description: z.string().min(1, "Deskripsi wajib diisi."),
});

export const updateHolidaySchema = createHolidaySchema.partial();
