// lib/schemas/agency-access-schema.ts
import { z } from "zod";

export const createAgencyAccessSchema = z.object({
  userId: z.string().min(1, "User ID tidak valid."),
});

export const updateAgencyAccessSchema = createAgencyAccessSchema.partial();
