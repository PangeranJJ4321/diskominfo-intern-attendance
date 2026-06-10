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
import { signIn } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { signInSchema, type SignInFormValues } from "@/lib/schemas/auth-schema";

export function SignInForm({
  className,
  ...props
}: Omit<React.ComponentProps<"form">, "onSubmit">) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState("");

  // 2. Initialize React Hook Form using the Zod resolver
  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // 3. Email Sign-In Submission Handler
  const onSubmit = async (data: SignInFormValues) => {
    setSubmitError("");

    const { data: signInData, error: signInError } = await signIn.email({
      email: data.email,
      password: data.password,
    });

    if (signInError) {
      setSubmitError(signInError.message || "Email atau kata sandi salah.");
      return;
    }

    router.push(signInData?.user.id ? "/" : "/");
  };

  // 4. Google OAuth Handler
  const handleGoogleSignIn = async () => {
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
          <h1 className="text-2xl font-bold">Selamat datang kembali</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Masukkan email dan kata sandi Anda untuk masuk ke akun Anda
          </p>
        </div>

        {/* Global Submission Errors */}
        {submitError && (
          <p className="text-sm font-medium text-destructive text-center">
            {submitError}
          </p>
        )}

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
              <div className="flex items-center justify-between">
                <FieldLabel htmlFor={field.name}>Kata sandi</FieldLabel>
                <a
                  href="/auth/forgot-password"
                  className="text-xs text-muted-foreground hover:underline underline-offset-4"
                >
                  Lupa kata sandi?
                </a>
              </div>
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
            Masuk
          </Button>
        </Field>

        <FieldSeparator>Atau lanjutkan dengan</FieldSeparator>

        {/* Google Authentication Option */}
        <Field>
          <Button
            variant="outline"
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-2"
          >
            <FcGoogle className="w-4 h-4" />
            Masuk dengan Google
          </Button>
          <FieldDescription className="text-center">
            Belum punya akun?{" "}
            <a href="/auth/sign-up" className="underline underline-offset-4">
              Daftar
            </a>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
