import { z } from "zod";
import { Role } from "@/lib/generated/prisma/enums";

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  role: z.enum([Role.SUPERADMIN, Role.ADMIN, Role.INTERN]),
  emailVerified: z.boolean(),
  image: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

/**
 * User creation schema
 */
export const createUserSchema = z.object({
  name: z.string().min(1, "Nama harus diisi").max(255),
  email: z.email("Email tidak valid").toLowerCase(),
  role: z.enum([Role.SUPERADMIN, Role.ADMIN, Role.INTERN]).default(Role.INTERN),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

/**
 * User update schema
 */
export const updateUserSchema = z.object({
  name: z.string().min(1, "Nama harus diisi").max(255).optional(),
  email: z.email("Email tidak valid").toLowerCase().optional(),
  role: z.enum([Role.SUPERADMIN, Role.ADMIN, Role.INTERN]).optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const allowedUserSortColumns = [
  "id",
  "name",
  "email",
  "role",
  "emailVerified",
  "image",
  "createdAt",
  "updatedAt",
] as const;

/**
 * Default user data object for optimistic UI updates.
 */
export const defaultUserData: UserData = {
  id: "",
  name: "",
  email: "",
  role: Role.INTERN,
  emailVerified: false,
  image: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

type UserData = z.infer<typeof userSchema>;
