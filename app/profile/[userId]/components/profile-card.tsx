"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { EditProfileDialog } from "./edit-profile-dialog";
import { useProfileStore } from "@/stores/profile-store";

function SectionRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      <div className="text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}

function formatDate(dateStr: string, locale = "id") {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateStr));
}

/**
 * Renders the profile detail card with user info and edit dialog.
 * Reads user data from the Zustand profile store.
 *
 * @returns {React.JSX.Element | null} The rendered card, or null if no user is loaded.
 */
export function ProfileCard() {
  const user = useProfileStore((s) => s.user);

  if (!user) return null;

  const hasCredential = user.accounts.some(
    (acc) => acc.providerId === "credential",
  );

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Detail profil</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Identitas akun Anda dan status registrasi.
            </p>
          </div>

          <div className="flex gap-2">
            <EditProfileDialog hasCredentialAccount={hasCredential} />
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <SectionRow label="Nama lengkap" value={user.name} />
          <SectionRow label="Alamat email" value={user.email} />
          <SectionRow
            label="Tanggal registrasi"
            value={formatDate(user.createdAt)}
          />
          <SectionRow
            label="Terakhir diperbarui"
            value={formatDate(user.updatedAt)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
