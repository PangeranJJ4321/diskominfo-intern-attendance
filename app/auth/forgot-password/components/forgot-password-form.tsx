"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "@/lib/schemas/auth-schema";
import Link from "next/link";
import { toast } from "sonner";

export function ForgotPasswordForm({
  className,
  ...props
}: Omit<React.ComponentProps<"form">, "onSubmit">) {
  const [submitError, setSubmitError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setSubmitError("");

    const { error } = await authClient.forgetPassword({
      email: data.email,
      redirectTo: "/auth/reset-password",
    });

    if (error) {
      setSubmitError(
        error.message || "Terjadi kesalahan saat meminta reset password."
      );
      return;
    }

    setIsSuccess(true);
    toast.success("Tautan reset kata sandi telah dikirim ke email Anda.");
  };

  if (isSuccess) {
    return (
      <div className={cn("flex flex-col gap-6 text-center", className)}>
        <div className="flex flex-col gap-1 text-center">
          <h1 className="text-2xl font-bold">Cek Email Anda</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Kami telah mengirimkan tautan untuk mengatur ulang kata sandi ke
            alamat email Anda.
          </p>
        </div>
        <Button asChild className="w-full">
          <Link href="/auth/sign-in">Kembali ke Masuk</Link>
        </Button>
      </div>
    );
  }

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={form.handleSubmit(onSubmit)}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Lupa Kata Sandi?</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Masukkan email yang terdaftar untuk mengatur ulang kata sandi Anda.
          </p>
        </div>

        {submitError && (
          <p className="text-sm font-medium text-destructive text-center">
            {submitError}
          </p>
        )}

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

        <Field>
          <Button
            type="submit"
            loading={form.formState.isSubmitting}
            className="w-full"
          >
            Kirim Tautan
          </Button>
        </Field>

        <div className="text-center text-sm">
          <Link
            href="/auth/sign-in"
            className="text-muted-foreground hover:underline underline-offset-4"
          >
            Kembali ke halaman masuk
          </Link>
        </div>
      </FieldGroup>
    </form>
  );
}
