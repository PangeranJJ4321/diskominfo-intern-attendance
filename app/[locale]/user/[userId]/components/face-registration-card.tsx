"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { Prisma } from "@/lib/generated/prisma/client";
import { FaceRegistrationDialog } from "./face-registration-dialog";

type UserWithFaceDescriptors = Prisma.UserGetPayload<{
  include: {
    faceDescriptors: {
      orderBy: {
        createdAt: "desc";
      };
      select: {
        id: true;
        createdAt: true;
        updatedAt: true;
      };
    };
  };
}>;

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

function formatDate(date: Date | null | undefined, locale: string) {
  if (!date) {
    return "—";
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

interface FaceRegistrationCardProps {
  user: UserWithFaceDescriptors;
  locale: string;
  openByDefault?: boolean;
}

export function FaceRegistrationCard({
  user,
  locale,
  openByDefault = false,
}: FaceRegistrationCardProps) {
  const descriptorCount = user.faceDescriptors.length;
  const latestDescriptor = user.faceDescriptors[0] ?? null;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Face registration</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Capture multiple aligned face descriptors for this account.
            </p>
          </div>

          <FaceRegistrationDialog
            key={
              openByDefault
                ? "face-registration-auto-open"
                : "face-registration"
            }
            userId={user.id}
            userName={user.name}
            openByDefault={openByDefault}
          />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <SectionRow
            label="Descriptor status"
            value={
              descriptorCount > 0
                ? `${descriptorCount} descriptor${descriptorCount > 1 ? "s" : ""} registered`
                : "No descriptor registered"
            }
          />
          <SectionRow
            label="Latest registration"
            value={formatDate(latestDescriptor?.createdAt, locale)}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export default FaceRegistrationCard;
