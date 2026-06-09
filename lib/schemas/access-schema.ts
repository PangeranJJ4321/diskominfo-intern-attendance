// lib/schemas/access-schema.ts
import { z } from "zod";

export const createAccessSchema = z.object({
  userId: z.string().min(1, "User ID tidak valid."),
});

export const updateAccessSchema = createAccessSchema.partial();
