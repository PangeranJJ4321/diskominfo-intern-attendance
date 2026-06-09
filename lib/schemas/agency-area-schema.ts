// lib/schemas/agency-area-schema.ts
import { z } from "zod";

export const createAgencyAreaSchema = z.object({
  geoData: z.record(z.string(), z.any()),
  timezone: z.string().min(1).default("Asia/Makassar"),
});

export const updateAgencyAreaSchema = createAgencyAreaSchema.partial();
