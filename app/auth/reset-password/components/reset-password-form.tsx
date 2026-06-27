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
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from "@/lib/schemas/auth-schema";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function ResetPasswordForm({
  className,
  ...props
}: Omit<React.ComponentProps<"form">, "onSubmit">) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState("");

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    setSubmitError("");

    // The token is usually read automatically from the URL by better-auth,
    // or you can pass it if explicitly required.
    const { error } = await authClient.resetPassword({
      newPassword: data.password,
    });

    if (error) {
      setSubmitError(
        error.message || "Terjadi kesalahan saat mengatur ulang kata sandi."
      );
      return;
    }

    toast.success("Kata sandi berhasil diubah! Silakan masuk kembali.");
    router.push("/auth/sign-in");
  };

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={form.handleSubmit(onSubmit)}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Atur Ulang Kata Sandi</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Masukkan kata sandi baru Anda di bawah ini.
          </p>
        </div>

        {submitError && (
          <p className="text-sm font-medium text-destructive text-center">
            {submitError}
          </p>
        )}

        <Controller
          name="password"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Kata Sandi Baru</FieldLabel>
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

        <Controller
          name="confirmPassword"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>
                Konfirmasi Kata Sandi Baru
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
            Simpan Kata Sandi
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
