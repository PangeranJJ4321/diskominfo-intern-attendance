// lib/schemas/intern-schema.ts
import { z } from "zod";

export const createInternSchema = z.object({
  userId: z.string().min(1, "User ID tidak valid."),
  agencyId: z.string().min(1, "Agency ID tidak valid."),
  institutionId: z.string().optional().nullable(),
  startedAt: z.coerce.date({ message: "Tanggal mulai wajib diisi." }),
  finishedAt: z.coerce.date().optional().nullable(),
});

export const updateInternSchema = createInternSchema.partial();
