"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { FaceRegisterDialog } from "./face-register-dialog";
import { useProfileStore } from "@/stores/profile-store";

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

/**
 * Renders the face registration card with status and registration dialog.
 * Reads user data from the Zustand profile store.
 *
 * @returns {React.JSX.Element | null} The rendered card, or null if no user or already max descriptors.
 */
export function FaceRegister() {
  const user = useProfileStore((s) => s.user);

  if (!user) return null;

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
            <FaceRegisterDialog openByDefault={descriptorCount === 0} />
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
