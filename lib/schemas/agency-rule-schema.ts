// lib/schemas/agency-rule-schema.ts
import { z } from "zod";

export const createAgencyRuleSchema = z.object({
  requireFaceVerification: z.boolean().default(true),
  requireWithinArea: z.boolean().default(true),
});

export const updateAgencyRuleSchema = createAgencyRuleSchema.partial();
