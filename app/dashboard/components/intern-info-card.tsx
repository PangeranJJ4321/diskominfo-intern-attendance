"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { getInterns } from "@/lib/services/interns";
import type { Intern } from "@/interfaces/models";

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
 * Displays intern info card showing start and end time of internship.
 *
 * @param {InternInfoCardProps} props - The component props.
 * @param {string} props.userId - The user ID to fetch intern data for.
 * @returns {React.JSX.Element} The rendered intern info card.
 */
export default function InternInfoCard({ userId }: InternInfoCardProps) {
  const [loading, setLoading] = useState(true);
  const [interns, setInterns] = useState<Intern[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function fetchInterns() {
      try {
        const data = await getInterns();
        const userInterns = data.filter((i) => i.userId === userId);
        if (active) {
          setInterns(userInterns);
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

    void fetchInterns();

    return () => {
      active = false;
    };
  }, [userId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 space-y-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-4 w-48" />
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

  if (interns.length === 0) {
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

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Informasi Magang</h2>

          {interns.map((intern) => (
            <div
              key={intern.id}
              className="rounded-lg border bg-muted/30 p-4 space-y-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {intern.agency?.name ?? "Instansi"}
                </Badge>
                {intern.institution?.name && (
                  <Badge variant="outline" className="text-xs">
                    {intern.institution.name}
                  </Badge>
                )}
                {intern.finishedAt &&
                new Date(intern.finishedAt) < new Date() ? (
                  <Badge variant="destructive" className="text-xs">
                    Selesai
                  </Badge>
                ) : (
                  <Badge
                    variant="default"
                    className="text-xs bg-emerald-500 hover:bg-emerald-500"
                  >
                    Aktif
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    Tanggal Mulai
                  </p>
                  <p className="font-medium">{formatDate(intern.startedAt)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    Tanggal Selesai
                  </p>
                  <p className="font-medium">{formatDate(intern.finishedAt)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
