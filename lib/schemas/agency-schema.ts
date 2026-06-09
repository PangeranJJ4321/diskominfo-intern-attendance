// lib/schemas/agency-schema.ts
import { z } from "zod";

export const createAgencySchema = z.object({
  name: z.string().min(1, "Nama instansi wajib diisi."),
  defaultShiftId: z.string().optional().nullable(),
});

export const updateAgencySchema = createAgencySchema.partial();
