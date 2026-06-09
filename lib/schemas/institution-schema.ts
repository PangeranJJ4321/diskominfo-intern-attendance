// lib/schemas/institution-schema.ts
import { z } from "zod";

export const createInstitutionSchema = z.object({
  name: z.string().min(1, "Nama institusi wajib diisi."),
});

export const updateInstitutionSchema = createInstitutionSchema.partial();
