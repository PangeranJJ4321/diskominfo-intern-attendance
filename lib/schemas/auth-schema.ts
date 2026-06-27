import { z } from "zod";

export const signInSchema = z.object({
  email: z.email("Silakan masukkan alamat email yang valid."),
  password: z.string().min(1, "Kata sandi wajib diisi."),
});

export type SignInFormValues = z.infer<typeof signInSchema>;

export const signUpSchema = z
  .object({
    name: z.string().min(2, "Nama minimal harus 2 karakter."),
    email: z.email("Silakan masukkan alamat email yang valid."),
    password: z.string().min(8, "Kata sandi minimal harus 8 karakter."),
    confirmPassword: z.string().min(1, "Silakan konfirmasi kata sandi Anda."),
  })
  .superRefine(({ confirmPassword, password }, ctx) => {
    if (confirmPassword !== password) {
      ctx.addIssue({
        code: "custom",
        message: "Kata sandi tidak cocok.",
        path: ["confirmPassword"],
      });
    }
  });

export type SignUpFormValues = z.infer<typeof signUpSchema>;

export const forgotPasswordSchema = z.object({
  email: z.email("Silakan masukkan alamat email yang valid."),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Kata sandi minimal harus 8 karakter."),
    confirmPassword: z.string().min(1, "Silakan konfirmasi kata sandi Anda."),
  })
  .superRefine(({ confirmPassword, password }, ctx) => {
    if (confirmPassword !== password) {
      ctx.addIssue({
        code: "custom",
        message: "Kata sandi tidak cocok.",
        path: ["confirmPassword"],
      });
    }
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
