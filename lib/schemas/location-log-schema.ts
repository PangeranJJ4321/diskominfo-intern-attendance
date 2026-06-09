// lib/schemas/location-log-schema.ts
import { z } from "zod";

export const createLocationLogSchema = z.object({
  internId: z.string().min(1, "Intern ID tidak valid."),
  latitude: z.number({ message: "Latitude wajib diisi." }),
  longitude: z.number({ message: "Longitude wajib diisi." }),
  ipAddress: z.string().optional().nullable(),
});
