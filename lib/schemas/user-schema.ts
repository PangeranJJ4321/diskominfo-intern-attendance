// lib/schemas/user-schema.ts
import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(2, "Nama minimal harus 2 karakter."),
  email: z.email("Silakan masukkan alamat email yang valid."),
  image: z.string().url("URL gambar tidak valid.").optional().nullable(),
  emailVerified: z.boolean().default(false).optional(),
  password: z
    .string()
    .min(8, "Kata sandi minimal harus 8 karakter.")
    .optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(2, "Nama minimal harus 2 karakter.").optional(),
  image: z.string().url("URL gambar tidak valid.").optional().nullable(),
  emailVerified: z.boolean().optional(),
  password: z
    .string()
    .min(8, "Kata sandi minimal harus 8 karakter.")
    .optional(),
});
