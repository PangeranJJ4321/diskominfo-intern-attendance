// lib/schemas/shift-assignment-schema.ts
import { z } from "zod";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const dateMessage = "Format tanggal harus YYYY-MM-DD.";

export const createShiftAssignmentSchema = z.object({
  internId: z.string().min(1, "Intern ID tidak valid."),
  shiftId: z.cuid2("Shift ID tidak valid."),
  startDate: z.string().regex(dateRegex, dateMessage),
  endDate: z.string().regex(dateRegex, dateMessage).optional().nullable(),
});

export const updateShiftAssignmentSchema =
  createShiftAssignmentSchema.partial();
