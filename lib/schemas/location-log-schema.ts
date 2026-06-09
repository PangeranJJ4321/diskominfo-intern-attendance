// lib/schemas/location-log-schema.ts
import { z } from "zod";

export const createLocationLogSchema = z.object({
  userId: z.string().min(1, "User ID tidak valid."),
  latitude: z.number({ message: "Latitude wajib diisi." }),
  longitude: z.number({ message: "Longitude wajib diisi." }),
  ipAddress: z.string().optional().nullable(),
});
