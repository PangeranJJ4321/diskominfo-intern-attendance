// lib/schemas/schedule-schema.ts
import { z } from "zod";
import { createTableQuerySchema } from "@/lib/schemas/query-schema";

const timeRegex = /^\d{2}:\d{2}:\d{2}$/;
const timeMessage = "Format waktu harus HH:MM:SS.";

export const createScheduleSchema = z.object({
  shiftId: z.cuid2("Shift ID tidak valid."),
  name: z.string().min(1, "Nama jadwal wajib diisi."),
  dayOfWeek: z.coerce
    .number()
    .int()
    .min(0, "Hari harus antara 0 (Minggu) dan 6 (Sabtu).")
    .max(6, "Hari harus antara 0 (Minggu) dan 6 (Sabtu)."),
  windowStart: z.string().regex(timeRegex, timeMessage),
  scheduleStart: z.string().regex(timeRegex, timeMessage),
  lateCutoff: z.string().regex(timeRegex, timeMessage),
  scheduleEnd: z.string().regex(timeRegex, timeMessage),
});

export const updateScheduleSchema = createScheduleSchema.partial();

const baseQuerySchema = createTableQuerySchema(
  ["id", "name", "dayOfWeek", "scheduleStart", "createdAt"],
  "dayOfWeek",
);

/**
 * Extends the base query schema with an optional dayOfWeek filter.
 * Accepts a comma-separated string of day numbers (0=Sun, 1=Mon, ... 6=Sat).
 */
export const scheduleQuerySchema = baseQuerySchema.extend({
  dayOfWeek: z
    .string()
    .optional()
    .transform((val) =>
      val
        ? val
            .split(",")
            .map(Number)
            .filter((n) => !isNaN(n) && n >= 0 && n <= 6)
        : [],
    ),
});
