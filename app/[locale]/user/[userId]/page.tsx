import { notFound } from "next/navigation";

import { Badge } from "@/components/reui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { getSession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";

// Import the DeleteAccountButton component
import DeleteAccountButton from "@/components/custom/delete-account-button";
// Import the InternCard component
import { InternCard } from "./components/intern-card";
// Import the AccountEditDialog component
import { AccountEditDialog } from "./components/account-edit-dialog";

type UserProfile = Prisma.UserGetPayload<{
  include: {
    accounts: {
      select: {
        providerId: true;
        createdAt: true;
      };
      orderBy: {
        createdAt: "asc";
      };
    };
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
    agencyAccesses: {
      include: {
        agency: true;
      };
      orderBy: {
        createdAt: "desc";
      };
    };
  };
}>;

const PROVIDER_LABELS: Record<string, string> = {
  credential: "Email & Password",
  google: "Google",
  github: "GitHub",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatDate(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function SectionRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function getRoleBadgeVariant(role: string) {
  switch (role) {
    case "SUPERADMIN":
      return "destructive";
    case "ADMIN":
      return "warning";
    default:
      return "secondary";
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; userId: string }>;
}) {
  const { locale, userId } = await params;
  const session = await getSession();

  if (!session) {
    notFound();
  }

  if (!userId) {
    notFound();
  }

  const user = (await prisma.user.findUnique({
    where: { id: userId },
    include: {
      accounts: {
        select: {
          providerId: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
      interns: {
        orderBy: {
          createdAt: "desc",
        },
        include: {
          agency: true,
          institution: true,
        },
      },
      faceDescriptors: {
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      agencyAccesses: {
        include: {
          agency: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  })) as UserProfile | null;

  if (!user) {
    notFound();
  }

  const isOwner = session.user.id === user.id;
  const initials = getInitials(user.name);
  const accountStatus = user.emailVerified
    ? "Verified"
    : "Pending verification";

  // Check if user has credential account for password change functionality
  const hasCredentialAccount = user.accounts.some(
    (account) => account.providerId === "credential"
  );

  return (
    <div className="min-h-screen h-fit overflow-hidden flex flex-col">
      <main className="flex justify-center p-4">
        <div className="mx-auto w-full max-w-2xl flex flex-col gap-4">
          {/* Hero / Avatar Section */}
          <div className="mb-8 flex flex-col items-center gap-4 text-center">
            <Avatar className="size-32 border border-border/60 bg-muted shadow-sm sm:size-40">
              <AvatarImage src={user.image ?? undefined} alt={user.name} />
              <AvatarFallback className="text-4xl font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex flex-col items-center gap-1">
              <Badge
                variant={getRoleBadgeVariant(user.role)}
                size="sm"
                radius="full"
                className="mb-2"
              >
                {user.role}
              </Badge>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                {user.name}
              </h1>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <div className="grid gap-6">
            {/* Account Information Card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">Account information</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Core profile details and ownership metadata.
                    </p>
                  </div>
                  {isOwner && (
                    <AccountEditDialog
                      userId={user.id}
                      initialName={user.name}
                      initialEmail={user.email}
                      hasCredentialAccount={hasCredentialAccount}
                    />
                  )}
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <SectionRow label="Full name" value={user.name} />
                  <SectionRow label="Email" value={user.email} />
                  <SectionRow label="Role" value={user.role} />
                  <SectionRow label="Verification" value={accountStatus} />
                  <SectionRow
                    label="Profile created"
                    value={formatDate(user.createdAt, locale)}
                  />
                  <SectionRow
                    label="Last updated"
                    value={formatDate(user.updatedAt, locale)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Sign-in Providers Card */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold">Sign-in providers</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Connected authentication methods.
                </p>

                <div className="mt-4 flex flex-col gap-3">
                  {user.accounts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No linked providers were found.
                    </p>
                  ) : (
                    user.accounts.map((account) => (
                      <div
                        key={`${account.providerId}-${account.createdAt.toISOString()}`}
                        className="flex items-center justify-between gap-3 rounded-lg border bg-foreground/5 px-4 py-3 transition-colors"
                      >
                        <div className="flex flex-col gap-0.5">
                          <p className="text-sm font-medium text-foreground">
                            {PROVIDER_LABELS[account.providerId] ??
                              account.providerId}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Added {formatDate(account.createdAt, locale)}
                          </p>
                        </div>
                        <Badge variant="outline" size="sm" radius="full">
                          Linked
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Intern Record Card - show only if user has intern record and is NOT an ADMIN */}
            <InternCard user={user} locale={locale} />

            {/* Agency Access Card - only visible to ADMIN or SUPERADMIN */}
            {(user.role === "ADMIN" || user.role === "SUPERADMIN") && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold">Agency access</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Agencies this account can reach in the system.
                  </p>

                  <div className="mt-4 flex flex-col gap-3">
                    {user.agencyAccesses.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No agency access entries were found.
                      </p>
                    ) : (
                      user.agencyAccesses.map((access) => (
                        <div
                          key={access.id}
                          className="rounded-lg border bg-foreground/5 p-4"
                        >
                          <p className="text-sm font-medium text-foreground">
                            {access.agency.name}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Granted {formatDate(access.createdAt, locale)}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Delete Account Card */}
            {isOwner && (
              <Card className="border-destructive/50">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-destructive">
                    Delete account
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Permanently remove your personal account and all of its
                    contents from the platform. This action is not reversible.
                  </p>
                  <div className="mt-4">
                    <DeleteAccountButton userId={user.id} />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
