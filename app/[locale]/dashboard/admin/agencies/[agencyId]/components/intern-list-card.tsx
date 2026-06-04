"use client";
import { Search } from "lucide-react";

import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type InternListItem = {
  id: string;
  userId: string;
  agencyId: string;
  name: string;
  email: string;
  startedAt: Date;
  finishedAt: Date | null;
};

type InternListCardProps = {
  interns: InternListItem[];
  selectedInternId: string | null;
  searchValue: string;
  onSearchValueChange: (value: string) => void;
  onSelectIntern: (internId: string) => void;
  isLoading: boolean;
  error: string | null;
};

function formatInternRange(startedAt: Date, finishedAt: Date | null): string {
  const dateFormatter = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const startLabel = dateFormatter.format(startedAt);
  const endLabel = finishedAt ? dateFormatter.format(finishedAt) : "Sekarang";

  return `${startLabel} - ${endLabel}`;
}

/**
 * Renders the selectable intern list used to switch attendance context.
 */
export function InternListCard({
  interns,
  selectedInternId,
  searchValue,
  onSearchValueChange,
  onSelectIntern,
  isLoading,
  error,
}: InternListCardProps): React.JSX.Element {
  const filteredInterns = interns.filter((intern) => {
    const query = searchValue.trim().toLowerCase();

    if (!query) {
      return true;
    }

    return (
      intern.name.toLowerCase().includes(query) ||
      intern.email.toLowerCase().includes(query)
    );
  });

  return (
    <Card className="h-full">
      <CardHeader className="space-y-3">
        <div className="space-y-1">
          <CardTitle className="text-lg">Peserta Magang</CardTitle>
          <p className="text-sm text-muted-foreground">
            Pilih peserta untuk menampilkan riwayat kehadiran yang sesuai.
          </p>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchValue}
            onChange={(event) => onSearchValueChange(event.target.value)}
            placeholder="Cari nama atau email"
            className="pl-9"
            aria-label="Cari peserta magang"
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>{interns.length} peserta</span>
          <span>{filteredInterns.length} ditampilkan</span>
        </div>

        {isLoading ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
            Memuat daftar peserta magang...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : filteredInterns.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
            Tidak ada peserta magang yang cocok.
          </div>
        ) : (
          <div className="max-h-136 space-y-2 overflow-auto pr-1">
            {filteredInterns.map((intern) => {
              const isSelected = intern.id === selectedInternId;

              return (
                <Button
                  key={intern.id}
                  type="button"
                  variant="ghost"
                  onClick={() => onSelectIntern(intern.id)}
                  className={cn(
                    "h-auto w-full justify-start rounded-xl border px-3 py-3 text-left",
                    isSelected
                      ? "border-primary bg-primary/5 hover:bg-primary/10"
                      : "border-border bg-background hover:bg-muted/40",
                  )}
                >
                  <div className="flex w-full flex-col gap-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-semibold">
                          {intern.name}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {intern.email}
                        </div>
                      </div>
                      {isSelected ? (
                        <Badge variant="primary-light" size="sm">
                          Dipilih
                        </Badge>
                      ) : null}
                    </div>

                    <div className="text-xs text-muted-foreground">
                      {formatInternRange(intern.startedAt, intern.finishedAt)}
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
