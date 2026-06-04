import { z } from "zod";

export const agencyAreaSchema = z.object({
  id: z.cuid2(),
  agencyId: z.cuid2(),
  geoData: z.json(),
  timezone: z.string().default("Asia/Makassar"),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

/**
 * Agency area creation schema
 */
export const createAgencyAreaSchema = z.object({
  geoData: z.json(),
  timezone: z.string().min(1).optional().default("Asia/Makassar"),
});

export type CreateAgencyAreaInput = z.infer<typeof createAgencyAreaSchema>;

export const updateAgencyAreaSchema = z.object({
  geoData: z.json().optional(),
  timezone: z.string().min(1).optional(),
});

export type UpdateAgencyAreaInput = z.infer<typeof updateAgencyAreaSchema>;

export const allowedAgencyAreaSortColumns = [
  "id",
  "agencyId",
  "timezone",
  "createdAt",
  "updatedAt",
] as const;

/**
 * Default agency area data object for optimistic UI updates.
 */
export const defaultAgencyAreaData: z.infer<typeof agencyAreaSchema> = {
  id: "",
  agencyId: "",
  geoData: {},
  timezone: "Asia/Makassar",
  createdAt: new Date(),
  updatedAt: new Date(),
};
