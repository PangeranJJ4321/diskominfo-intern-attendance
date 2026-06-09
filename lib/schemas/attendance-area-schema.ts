//lib/schemas/attendance-area-schema.ts
import { z } from "zod";

export const createAreaSchema = z.object({
  geoData: z.record(z.string(), z.any()),
  timezone: z.string().min(1).default("Asia/Makassar"),
});

export const updateAreaSchema = createAreaSchema.partial();
