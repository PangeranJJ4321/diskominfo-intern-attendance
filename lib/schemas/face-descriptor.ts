import { type FaceDescriptor } from "@/lib/generated/prisma/client";
import { z } from "zod";

export const faceDescriptorSchema = z.object({
  id: z.cuid2(),
  userId: z.string(),
  descriptor: z.array(z.number().finite()),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

/**
 * Face descriptor creation schema
 */
export const createFaceDescriptorSchema = z.object({
  userId: z.string().optional(),
  descriptor: z.array(z.number().finite()).min(1, "Descriptor harus diisi"),
});

export type CreateFaceDescriptorInput = z.infer<
  typeof createFaceDescriptorSchema
>;

export const allowedFaceDescriptorSortColumns = [
  "id",
  "userId",
  "createdAt",
  "updatedAt",
] as const;

/**
 * Default face descriptor data object for optimistic UI updates.
 */
export const defaultFaceDescriptorData: FaceDescriptor = {
  id: "",
  userId: "",
  descriptor: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};
