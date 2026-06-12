"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getInterns } from "@/lib/services/interns";
import { getAgencyRule } from "@/lib/services/agencies";
import type { Intern, AgencyRule } from "@/interfaces/models";
import { ArrowRight, Calendar, Camera, Map as MapIcon } from "lucide-react";

interface InternInfoCardProps {
  userId: string;
}

/**
 * Formats a date string into a localized Indonesian date.
 *
 * @param dateStr - The ISO date string.
 * @returns The formatted date string.
 */
function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
  }).format(new Date(dateStr));
}

/**
 * Displays intern info card showing dates and attendance rules.
 *
 * @param {InternInfoCardProps} props - The component props.
 * @param {string} props.userId - The user ID to fetch intern data for.
 * @returns {React.JSX.Element} The rendered intern info card.
 */
export function InternInfoCard({ userId }: InternInfoCardProps) {
  const [loading, setLoading] = useState(true);
  const [intern, setIntern] = useState<Intern | null>(null);
  const [agencyRule, setAgencyRule] = useState<AgencyRule | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function fetchData() {
      try {
        const interns = await getInterns();
        const userIntern = interns.find((i) => i.userId === userId) ?? null;

        if (active) {
          setIntern(userIntern);
        }

        if (userIntern) {
          try {
            const rule = await getAgencyRule(userIntern.agencyId);
            if (active) {
              setAgencyRule(rule);
            }
          } catch {
            if (active) {
              setAgencyRule(null);
            }
          }
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Gagal memuat data magang",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void fetchData();

    return () => {
      active = false;
    };
  }, [userId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-8 w-48" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/20 bg-destructive/5">
        <CardContent className="p-6">
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!intern) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">
            Belum ada data magang yang terdaftar. Silakan hubungi administrator
            untuk mendaftarkan data magang Anda.
          </p>
        </CardContent>
      </Card>
    );
  }

  const internship = {
    startDate: intern.startedAt ? formatDate(intern.startedAt) : "—",
    finishDate: intern.finishedAt
      ? formatDate(intern.finishedAt)
      : "Sedang Berjalan",
  };

  const activeRule = agencyRule ?? {
    requireFaceVerification: false,
    requireWithinArea: false,
  };

  return (
    <Card className="w-full transition-all hover:shadow-md">
      <CardContent className="p-6 space-y-6">
        {/* Dates Row */}
        <div className="flex items-center justify-between rounded-lg border bg-muted/10 p-4">
          <div className="space-y-1">
            <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <Calendar className="size-3.5" />
              Mulai
            </span>
            <p className="text-sm font-semibold sm:text-base">
              {internship.startDate}
            </p>
          </div>

          <ArrowRight className="size-5 text-muted-foreground/50" />

          <div className="space-y-1 text-right">
            <span className="flex items-center justify-end gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Selesai
              <Calendar className="size-3.5" />
            </span>
            <p className="text-sm font-semibold sm:text-base">
              {internship.finishDate}
            </p>
          </div>
        </div>

        <Separator />

        {/* Attendance Rules */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Aturan Presensi
          </h4>
          <div className="space-y-2">
            {activeRule.requireFaceVerification && (
              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-2.5 text-sm">
                <div className="flex items-center gap-2">
                  <Camera className="size-4 text-muted-foreground" />
                  <span>Verifikasi Wajah</span>
                </div>
                <Badge variant="default">Wajib</Badge>
              </div>
            )}

            {activeRule.requireWithinArea && (
              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-2.5 text-sm">
                <div className="flex items-center gap-2">
                  <MapIcon className="size-4 text-muted-foreground" />
                  <span>Verifikasi Lokasi</span>
                </div>
                <Badge variant="default">Wajib</Badge>
              </div>
            )}

            {!activeRule.requireFaceVerification &&
              !activeRule.requireWithinArea && (
                <p className="text-xs text-muted-foreground">
                  Tidak ada aturan presensi yang diterapkan.
                </p>
              )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
