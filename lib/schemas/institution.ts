import { z } from "zod";
import { type Institution } from "@/lib/generated/prisma/client";

export const institutionSchema = z.object({
  id: z.cuid2(),
  name: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

/**
 * Institution creation schema
 */
export const createInstitutionSchema = z.object({
  name: z.string().min(1, "Nama institusi harus diisi").max(255),
});

export type CreateInstitutionInput = z.infer<typeof createInstitutionSchema>;

/**
 * Institution update schema
 */
export const updateInstitutionSchema = z.object({
  name: z.string().min(1, "Nama institusi harus diisi").max(255).optional(),
});

export type UpdateInstitutionInput = z.infer<typeof updateInstitutionSchema>;

export const allowedInstitutionSortColumns = [
  "id",
  "name",
  "createdAt",
  "updatedAt",
] as const;

/**
 * Default institution data object for optimistic UI updates.
 */
export const defaultInstitutionData: Institution = {
  id: "",
  name: "",
  createdAt: new Date(),
  updatedAt: new Date(),
};
