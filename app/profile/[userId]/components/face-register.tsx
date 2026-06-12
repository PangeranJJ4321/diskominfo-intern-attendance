"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { FaceRegisterDialog } from "./face-register-dialog";
import { type FaceRegisterProps } from "@/interfaces/profile";

function SectionRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      <p className="text-sm font-medium text-foreground">{value || "—"}</p>
    </div>
  );
}

function formatDate(dateStr: string | null | undefined, locale = "id") {
  if (!dateStr) {
    return "—";
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateStr));
}

export function FaceRegister({
  user,
  onUpdate,
  openByDefault = false,
}: FaceRegisterProps) {
  const descriptorCount = user.faceDescriptors.length;
  const latestDescriptor = user.faceDescriptors[0] ?? null;

  if (descriptorCount >= 5) {
    return null;
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Registrasi wajah</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Ambil beberapa deskriptor wajah yang sejajar untuk akun ini.
            </p>
          </div>

          <div className="flex gap-2">
            <FaceRegisterDialog
              key={
                openByDefault
                  ? "face-registration-auto-open"
                  : "face-registration"
              }
              userId={user.id}
              userName={user.name}
              openByDefault={openByDefault}
              onSuccess={onUpdate}
            />
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <SectionRow
            label="Status deskriptor"
            value={
              descriptorCount > 0
                ? `${descriptorCount} deskriptor terdaftar`
                : "Belum ada deskriptor terdaftar"
            }
          />
          <SectionRow
            label="Registrasi terakhir"
            value={formatDate(latestDescriptor?.createdAt)}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export default FaceRegister;
