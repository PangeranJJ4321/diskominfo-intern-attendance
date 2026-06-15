"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FcGoogle } from "react-icons/fc";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { signUp, signIn } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { signUpSchema, type SignUpFormValues } from "@/lib/schemas/auth-schema";
import { toast } from "sonner";

export function SignUpForm({
  className,
  ...props
}: Omit<React.ComponentProps<"form">, "onSubmit">) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState("");

  // 2. Initialize React Hook Form using the Zod resolver
  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  /**
   * Submission handler for the email-based sign-up form.
   * Registers the user, shows a success toast, and redirects to their profile page.
   *
   * @param {SignUpFormValues} data - The values submitted from the signup form.
   * @returns {Promise<void>} A promise resolving when sign-up finishes.
   */
  const onSubmit = async (data: SignUpFormValues) => {
    setSubmitError("");

    const { error: signUpError } = await signUp.email({
      email: data.email,
      password: data.password,
      name: data.name,
    });

    if (signUpError) {
      setSubmitError(
        signUpError.message || "Terjadi kesalahan saat mendaftar.",
      );
      return;
    }

    toast.success("Akun berhasil dibuat. Selamat datang!");
    router.push("/");
  };

  /**
   * Google OAuth handler for sign-up.
   * Initiates Google social login with a callback redirecting to the profile page.
   *
   * @returns {Promise<void>} A promise resolving when authentication flow is initiated.
   */
  const handleGoogleSignUp = async () => {
    await signIn.social({
      provider: "google",
      callbackURL: "/",
    });
  };

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={form.handleSubmit(onSubmit)}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Buat akun</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Masukkan detail Anda di bawah ini untuk membuat akun Anda
          </p>
        </div>

        {/* Global Submission Errors */}
        {submitError && (
          <p className="text-sm font-medium text-destructive text-center">
            {submitError}
          </p>
        )}

        {/* Name Field Controlled Group */}
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Nama</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="text"
                placeholder="John Doe"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && fieldState.error && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />

        {/* Email Field Controlled Group */}
        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Email</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="email"
                placeholder="m@example.com"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && fieldState.error && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />

        {/* Password Field Controlled Group */}
        <Controller
          name="password"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Kata sandi</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="password"
                placeholder="••••••••"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && fieldState.error && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />

        {/* Confirm Password Field Controlled Group */}
        <Controller
          name="confirmPassword"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>
                Konfirmasi kata sandi
              </FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="password"
                placeholder="••••••••"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && fieldState.error && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />

        <Field>
          <Button
            type="submit"
            loading={form.formState.isSubmitting}
            className="w-full"
          >
            Daftar
          </Button>
        </Field>

        <FieldSeparator>Atau lanjutkan dengan</FieldSeparator>

        {/* Google Authentication Option */}
        <Field>
          <Button
            variant="outline"
            type="button"
            onClick={handleGoogleSignUp}
            className="w-full flex items-center justify-center gap-2"
          >
            <FcGoogle className="w-4 h-4" />
            Daftar dengan Google
          </Button>
          <FieldDescription className="text-center">
            Sudah punya akun?{" "}
            <a href="/auth/sign-in" className="underline underline-offset-4">
              Masuk
            </a>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
