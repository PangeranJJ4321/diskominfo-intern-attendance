"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { Prisma } from "@/lib/generated/prisma/client";
import { InternCreateDialog } from "./intern-create-dialog";
import { InternEditDialog } from "./intern-edit-dialog";
import { FaceRegistrationCard } from "./face-registration-card";

type UserWithIntern = Prisma.UserGetPayload<{
  include: {
    interns: {
      orderBy: {
        createdAt: "desc";
      };
      include: {
        agency: true;
        institution: true;
      };
    };
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

function formatDateOnly(date: Date | null | undefined, locale: string) {
  if (!date) return "—";
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
  }).format(date);
}

interface InternCardProps {
  user: UserWithIntern;
  locale: string;
}

export function InternCard({ user, locale }: InternCardProps) {
  const [openFaceRegistration, setOpenFaceRegistration] = useState(false);

  if (user.role !== "INTERN") return null;

  const intern = user.interns[0] ?? null;
  const hasIntern = !!intern;
  const isInternCompleted =
    !!intern?.finishedAt && new Date() > intern.finishedAt;
  const internStatus = isInternCompleted
    ? "Completed"
    : hasIntern
      ? "Active"
      : "—";

  const faceDescriptorCount = user.faceDescriptors.length;
  const hasMinimumFaceDescriptors = faceDescriptorCount >= 5;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">Intern record</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Employment and placement details tied to this user account.
            </p>
          </div>
          <div className="ml-4">
            {hasIntern && intern ? (
              <InternEditDialog
                internId={intern.id}
                initialAgencyName={intern.agency.name}
                initialInstitutionId={intern.institutionId ?? null}
                initialStartedAt={intern.startedAt}
                initialFinishedAt={intern.finishedAt ?? null}
              />
            ) : (
              <InternCreateDialog
                userId={user.id}
                openByDefault={!hasIntern}
                onSuccess={() => {
                  setOpenFaceRegistration(true);
                }}
              />
            )}
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <SectionRow label="Intern name" value={user.name} />
          <SectionRow label="Agency" value={intern?.agency?.name} />
          <SectionRow
            label="Institution"
            value={
              intern?.institution?.name ?? (hasIntern ? "Not assigned" : "—")
            }
          />
          <SectionRow
            label="Start date"
            value={formatDateOnly(intern?.startedAt ?? null, locale)}
          />
          <SectionRow
            label="Finish date"
            value={
              intern?.finishedAt
                ? formatDateOnly(intern.finishedAt, locale)
                : hasIntern
                  ? "Ongoing"
                  : "—"
            }
          />
          <SectionRow label="Intern status" value={internStatus} />
        </div>

        <div className="mt-6">
          {!hasMinimumFaceDescriptors && (
            <FaceRegistrationCard
              user={user}
              locale={locale}
              openByDefault={openFaceRegistration}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
