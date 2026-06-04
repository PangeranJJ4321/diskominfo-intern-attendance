import { z } from "zod";
import { userSchema } from "@/lib/schemas/user";
import { type AgencyAccess } from "@/lib/generated/prisma/client";

export const agencyAccessSchema = z.object({
  id: z.cuid2(),
  agencyId: z.cuid2(),
  userId: z.string(),
  user: userSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

/**
 * Agency access creation schema
 */
export const createAgencyAccessSchema = z.object({
  agencyId: z.cuid2().min(1, "Agency ID is required"),
  userId: z.string().min(1, "User ID is required"),
});

export type CreateAgencyAccessInput = z.infer<typeof createAgencyAccessSchema>;

/**
 * Agency access update schema
 */
export const updateAgencyAccessSchema = z.object({
  agencyId: z.cuid2().min(1, "Agency ID is required").optional(),
  userId: z.string().min(1, "User ID is required").optional(),
});

export type UpdateAgencyAccessInput = z.infer<typeof updateAgencyAccessSchema>;

export const allowedAgencyAccessSortColumns = [
  "id",
  "agencyId",
  "userId",
  "createdAt",
  "updatedAt",
] as const;

/**
 * Default agency access data object for optimistic UI updates.
 */
export const defaultAgencyAccessData: AgencyAccess = {
  id: "",
  agencyId: "",
  userId: "",
  createdAt: new Date(),
  updatedAt: new Date(),
};
