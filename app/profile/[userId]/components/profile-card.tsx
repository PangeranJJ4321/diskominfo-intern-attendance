"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { EditProfileDialog } from "./edit-profile-dialog";
import type { ProfileCardProps } from "@/interfaces/profile";

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

export function ProfileCard({
  user,
  onUpdate,
  hasCredential,
}: ProfileCardProps) {
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
            <EditProfileDialog
              userId={user.id}
              initialName={user.name}
              hasCredentialAccount={hasCredential}
              onSuccess={onUpdate}
            />
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
