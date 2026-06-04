import { z } from "zod";

export const agencyScheduleSchema = z.object({
  id: z.cuid2(),
  agencyId: z.cuid2(),
  name: z.string(),
  dayOfWeek: z.number().int().min(0).max(6),
  agencyScheduleStart: z.iso.time(),
  agencyScheduleEnd: z.iso.time(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

/**
 * Agency schedule creation schema
 */
export const createAgencyScheduleSchema = z.object({
  agencyId: z.cuid2(),
  name: z.string().min(1, "Nama jadwal harus diisi"),
  dayOfWeek: z.number().int().min(0).max(6),
  agencyScheduleStart: z.iso.time(),
  agencyScheduleEnd: z.iso.time(),
});

export type CreateAgencyScheduleInput = z.infer<
  typeof createAgencyScheduleSchema
>;

/**
 * Agency schedule update schema
 */
export const updateAgencyScheduleSchema = z.object({
  name: z.string().min(1, "Nama jadwal harus diisi").optional(),
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  agencyScheduleStart: z.iso.time().optional(),
  agencyScheduleEnd: z.iso.time().optional(),
});

export type UpdateAgencyScheduleInput = z.infer<
  typeof updateAgencyScheduleSchema
>;

export const allowedAgencyScheduleSortColumns = [
  "id",
  "agencyId",
  "name",
  "dayOfWeek",
  "agencyScheduleStart",
  "agencyScheduleEnd",
  "createdAt",
  "updatedAt",
] as const;

/**
 * Default agency schedule data object for optimistic UI updates.
 */
export const defaultAgencyScheduleData: AgencyScheduleData = {
  id: "",
  agencyId: "",
  name: "",
  dayOfWeek: 0,
  agencyScheduleStart: "09:00:00",
  agencyScheduleEnd: "17:00:00",
  createdAt: new Date(),
  updatedAt: new Date(),
};

type AgencyScheduleData = z.infer<typeof agencyScheduleSchema>;
