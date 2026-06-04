import { z } from "zod";

export const agencyHolidaySchema = z.object({
  id: z.cuid2(),
  agencyId: z.cuid2(),
  date: z.coerce.date(),
  description: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

/**
 * Agency holiday creation schema
 */
export const createAgencyHolidaySchema = z.object({
  agencyId: z.cuid2().min(1, "Agency ID is required"),
  date: z.coerce.date(),
  description: z.string().min(1, "Description is required"),
});

export type CreateAgencyHolidayInput = z.infer<
  typeof createAgencyHolidaySchema
>;

/**
 * Agency holiday update schema
 */
export const updateAgencyHolidaySchema = z.object({
  date: z.coerce.date().optional(),
  description: z.string().min(1, "Description is required").optional(),
});

export type UpdateAgencyHolidayInput = z.infer<
  typeof updateAgencyHolidaySchema
>;

export const allowedAgencyHolidaySortColumns = [
  "id",
  "agencyId",
  "date",
  "description",
  "createdAt",
  "updatedAt",
] as const;

export const nagerPublicHolidaySchema = z.object({
  date: z.string(),
  localName: z.string(),
  name: z.string(),
});

/**
 * Default agency holiday data object for optimistic UI updates.
 */
export const defaultAgencyHolidayData: AgencyHolidayData = {
  id: "",
  agencyId: "",
  date: new Date(),
  description: "",
  createdAt: new Date(),
  updatedAt: new Date(),
};

type AgencyHolidayData = z.infer<typeof agencyHolidaySchema>;
