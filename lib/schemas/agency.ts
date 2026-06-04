import { z } from "zod";
import { type Agency } from "@/lib/generated/prisma/client";

export const agencySchema = z.object({
  id: z.cuid2(),
  name: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

/**
 * Agency creation schema
 */
export const createAgencySchema = z.object({
  name: z.string().min(1, "Nama dinas harus diisi").max(255),
});

export type CreateAgencyInput = z.infer<typeof createAgencySchema>;

/**
 * Agency update schema
 */
export const updateAgencySchema = z.object({
  name: z.string().min(1, "Nama dinas harus diisi").max(255).optional(),
});

export type UpdateAgencyInput = z.infer<typeof updateAgencySchema>;

export const allowedAgencySortColumns = [
  "id",
  "name",
  "createdAt",
  "updatedAt",
] as const;

/**
 * Default agency data object for optimistic UI updates.
 */
export const defaultAgencyData: Agency = {
  id: "",
  name: "",
  createdAt: new Date(),
  updatedAt: new Date(),
};
