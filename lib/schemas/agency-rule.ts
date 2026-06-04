import { z } from "zod";

export const agencyRuleSchema = z.object({
  id: z.cuid2(),
  agencyId: z.cuid2(),
  requireFaceVerification: z.boolean(),
  requireWithinArea: z.boolean(),
  lateToleranceMinutes: z.number().int(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

/**
 * Agency rule creation schema
 */
export const createAgencyRuleSchema = z.object({
  agencyId: z.cuid2(),
  requireFaceVerification: z.boolean().default(true),
  requireWithinArea: z.boolean().default(true),
  lateToleranceMinutes: z.number().int().min(0).default(15),
});

export type CreateAgencyRuleInput = z.infer<typeof createAgencyRuleSchema>;

/**
 * Agency rule update schema
 */
export const updateAgencyRuleSchema = z.object({
  requireFaceVerification: z.boolean().optional(),
  requireWithinArea: z.boolean().optional(),
  lateToleranceMinutes: z.number().int().min(0).optional(),
});

export type UpdateAgencyRuleInput = z.infer<typeof updateAgencyRuleSchema>;

export const allowedAgencyRuleSortColumns = [
  "id",
  "agencyId",
  "requireFaceVerification",
  "requireWithinArea",
  "lateToleranceMinutes",
  "createdAt",
  "updatedAt",
] as const;

/**
 * Default agency rule data object for optimistic UI updates.
 */
export const defaultAgencyRuleData: AgencyRuleData = {
  id: "",
  agencyId: "",
  requireFaceVerification: true,
  requireWithinArea: true,
  lateToleranceMinutes: 15,
  createdAt: new Date(),
  updatedAt: new Date(),
};

type AgencyRuleData = z.infer<typeof agencyRuleSchema>;
