import { z } from "zod";

export const internSchema = z.object({
  id: z.cuid2(),
  userId: z.string(),
  agencyId: z.cuid2(),
  institutionId: z.cuid2().nullable(),
  startedAt: z.coerce.date(),
  finishedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

/**
 * Intern creation schema
 */
export const createInternSchema = z
  .object({
    userId: z.string().min(1, "User harus dipilih"),
    agencyId: z.cuid2().min(1, "Agency harus dipilih"),
    institutionId: z
      .preprocess(
        (value) => (value === "" ? null : value),
        z.cuid2().nullable().optional(),
      )
      .optional(),
    startedAt: z.coerce.date("Tanggal mulai tidak valid"),
    finishedAt: z
      .preprocess(
        (value) => (value === "" ? null : value),
        z.coerce.date("Tanggal selesai tidak valid").nullable().optional(),
      )
      .optional(),
  })
  .refine(
    (data) =>
      !data.finishedAt || !data.startedAt || data.finishedAt >= data.startedAt,
    {
      message: "Tanggal selesai harus setelah tanggal mulai",
    },
  );

export type CreateInternInput = z.infer<typeof createInternSchema>;

/**
 * Intern update schema
 */
export const updateInternSchema = z
  .object({
    userId: z.string().min(1, "User harus dipilih").optional(),
    agencyId: z.cuid2().min(1, "Agency harus dipilih").optional(),
    institutionId: z
      .preprocess(
        (value) => (value === "" ? null : value),
        z.cuid2().nullable().optional(),
      )
      .optional(),
    startedAt: z.coerce.date("Tanggal mulai tidak valid").optional(),
    finishedAt: z
      .preprocess(
        (value) => (value === "" ? null : value),
        z.coerce.date("Tanggal selesai tidak valid").nullable().optional(),
      )
      .optional(),
  })
  .refine(
    (data) =>
      !data.finishedAt || !data.startedAt || data.finishedAt >= data.startedAt,
    {
      message: "Tanggal selesai harus setelah tanggal mulai",
      path: ["finishedAt"],
    },
  );

export type UpdateInternInput = z.infer<typeof updateInternSchema>;

export const allowedInternSortColumns = [
  "id",
  "userId",
  "agencyId",
  "institutionId",
  "startedAt",
  "finishedAt",
  "createdAt",
  "updatedAt",
] as const;

/**
 * Default intern data object for optimistic UI updates.
 */
export const defaultInternData: InternData = {
  id: "",
  userId: "",
  agencyId: "",
  institutionId: null,
  startedAt: new Date(),
  finishedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

type InternData = z.infer<typeof internSchema>;
