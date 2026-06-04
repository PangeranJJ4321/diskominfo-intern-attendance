"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { agencyAccessSchema } from "@/lib/schemas/agency-access";
import { userSchema } from "@/lib/schemas/user";

type AgencyAccessResponse = z.infer<typeof agencyAccessSchema>;
type User = z.infer<typeof userSchema>;

type AgencyAccessEditorProps = {
  agencyId: string;
  currentUserId: string | null;
};

function normalizeMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

export default function AgencyAccessEditor({
  agencyId,
  currentUserId,
}: AgencyAccessEditorProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [isUserSearchOpen, setIsUserSearchOpen] = useState(false);
  const [accesses, setAccesses] = useState<AgencyAccessResponse[]>([]);
  const [admins, setAdmins] = useState<User[]>([]);

  useEffect(() => {
    const abortController = new AbortController();

    async function loadData() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const [accessResponse, usersResponse] = await Promise.all([
          fetch(`/api/agency-accesses?agencyId=${agencyId}`, {
            signal: abortController.signal,
          }),
          fetch(`/api/users?role=ADMIN&limit=100`, {
            signal: abortController.signal,
          }),
        ]);

        if (!accessResponse.ok) {
          const payload = (await accessResponse.json().catch(() => ({}))) as {
            error?: string;
          };

          throw new Error(payload.error ?? "Gagal memuat akses dinas");
        }

        if (!usersResponse.ok) {
          const payload = (await usersResponse.json().catch(() => ({}))) as {
            error?: string;
          };

          throw new Error(payload.error ?? "Gagal memuat daftar admin");
        }

        const accessPayload: unknown = await accessResponse.json();
        const usersPayload: unknown = await usersResponse.json();

        // Parse Admins FIRST so we can use them to patch the missing user relation in accesses
        const nextAdmins = Array.isArray(
          (usersPayload as { data?: unknown[] })?.data,
        )
          ? (usersPayload as { data: unknown[] }).data
              .map((item) => userSchema.safeParse(item))
              .filter(
                (result): result is { success: true; data: User } =>
                  result.success,
              )
              .map((result) => result.data)
          : [];

        // Create a quick lookup map of userId -> full User object
        const adminsMap = new Map(nextAdmins.map((admin) => [admin.id, admin]));

        const rawAccesses = Array.isArray(
          (accessPayload as { data?: unknown[] })?.data,
        )
          ? (accessPayload as { data: unknown[] }).data
          : [];

        const nextAccesses = rawAccesses
          .map((item) => {
            const raw = item as Record<string, unknown>;
            const rawAgencyId =
              typeof raw.agencyId === "string" ? raw.agencyId : "";

            if (rawAgencyId !== agencyId) {
              return null;
            }

            // Try direct parse first (if the API eventually includes the user)
            const direct = agencyAccessSchema.safeParse(item);
            if (direct.success) return direct.data;

            // Fallback: Because GET doesn't include user relation, stitch it using fetched admins
            try {
              const userId = typeof raw.userId === "string" ? raw.userId : "";
              const matchedAdmin = adminsMap.get(userId);

              // Skip if we can't find matching user details
              if (!matchedAdmin) return null;

              const createdAt =
                raw.createdAt instanceof Date
                  ? raw.createdAt
                  : raw.createdAt
                    ? new Date(String(raw.createdAt))
                    : new Date();

              const updatedAt =
                raw.updatedAt instanceof Date
                  ? raw.updatedAt
                  : raw.updatedAt
                    ? new Date(String(raw.updatedAt))
                    : new Date();

              const patched = {
                id: typeof raw.id === "string" ? raw.id : "",
                agencyId: rawAgencyId,
                userId,
                createdAt,
                updatedAt,
                user: matchedAdmin, // Use stitched full user object here
              } as const;

              const second = agencyAccessSchema.safeParse(patched);
              if (second.success) return second.data;
            } catch {
              // ignore and fall through to skip this item
            }

            return null;
          })
          .filter((result): result is AgencyAccessResponse => result !== null);

        setAccesses(nextAccesses);
        setAdmins(nextAdmins);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setLoadError(
          error instanceof Error ? error.message : "Gagal memuat akses dinas",
        );
        setAccesses([]);
        setAdmins([]);
      } finally {
        setIsLoading(false);
      }
    }

    void loadData();

    return () => abortController.abort();
  }, [agencyId, reloadNonce]);

  const accessUserIds = useMemo(
    () => new Set(accesses.map((access) => access.userId)),
    [accesses],
  );

  const availableAdmins = useMemo(
    () =>
      admins
        .filter((admin) => admin.id !== currentUserId)
        .filter((admin) => !accessUserIds.has(admin.id))
        .sort((left, right) => left.name.localeCompare(right.name)),
    [accessUserIds, admins, currentUserId],
  );

  const sortedAccesses = useMemo(
    () =>
      [...accesses].sort((left, right) =>
        left.user.name.localeCompare(right.user.name),
      ),
    [accesses],
  );

  const addAccess = async (admin: User) => {
    if (isSaving) {
      return;
    }

    if (admin.id === currentUserId) {
      toast.error("Anda tidak dapat menambahkan akses untuk diri sendiri.");
      return;
    }

    if (accessUserIds.has(admin.id)) {
      toast.info("Admin ini sudah memiliki akses dinas.");
      return;
    }

    setIsSaving(true);
    setIsUserSearchOpen(false);

    const previousAccesses = accesses;
    const optimisticAccess: AgencyAccessResponse = {
      id: `optimistic-${admin.id}`,
      agencyId,
      userId: admin.id,
      user: admin,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setAccesses((currentAccesses) => [...currentAccesses, optimisticAccess]);

    try {
      const response = await fetch("/api/agency-accesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agencyId,
          userId: admin.id,
        }),
      });

      const payload: unknown = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = (payload as { error?: string }).error;
        throw new Error(message ?? "Gagal menambahkan akses admin");
      }

      const parsed = agencyAccessSchema.safeParse(payload);

      if (!parsed.success) {
        throw new Error("Respons akses dinas tidak valid");
      }

      setAccesses((currentAccesses) => [
        ...currentAccesses.filter((access) => access.userId !== admin.id),
        parsed.data,
      ]);
      toast.success("Akses admin berhasil ditambahkan");
    } catch (error) {
      setAccesses(previousAccesses);
      toast.error(normalizeMessage(error, "Gagal menambahkan akses admin"));
    } finally {
      setIsSaving(false);
    }
  };

  const removeAccess = async (access: AgencyAccessResponse) => {
    if (isSaving) {
      return;
    }

    if (access.userId === currentUserId) {
      toast.error("Anda tidak dapat menghapus akses Anda sendiri.");
      return;
    }

    setIsSaving(true);

    const previousAccesses = accesses;
    setAccesses((currentAccesses) =>
      currentAccesses.filter((item) => item.id !== access.id),
    );

    try {
      const response = await fetch(`/api/agency-accesses/${access.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
        };

        throw new Error(payload.error ?? "Gagal menghapus akses admin");
      }

      toast.success("Akses admin berhasil dihapus");
    } catch (error) {
      setAccesses(previousAccesses);
      toast.error(normalizeMessage(error, "Gagal menghapus akses admin"));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="flex flex-col items-center justify-center gap-4 p-8 text-muted-foreground">
        <Spinner className="size-7" />
        <p className="text-sm">Memuat editor akses admin...</p>
      </Card>
    );
  }

  if (loadError) {
    return (
      <Card className="border-destructive/20 bg-destructive/5 p-6">
        <div className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Akses Admin Dinas</h2>
            <p className="text-sm text-muted-foreground">{loadError}</p>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setLoadError(null);
              setReloadNonce((currentValue) => currentValue + 1);
            }}
          >
            Coba lagi
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden p-6">
      <div className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Akses Admin Dinas</h2>
          <p className="text-sm text-muted-foreground">
            Tambahkan admin lain yang boleh mengelola dinas ini. Akses Anda
            sendiri tidak bisa dihapus dari halaman ini.
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="space-y-2">
              <p className="text-sm font-medium">Cari admin</p>
              <Popover
                open={isUserSearchOpen}
                onOpenChange={setIsUserSearchOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    disabled={isSaving}
                  >
                    {availableAdmins.length === 0
                      ? "Tidak ada admin tersedia"
                      : "Pilih admin untuk diberi akses"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-105 p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Cari berdasarkan nama atau email" />
                    <CommandList>
                      <CommandEmpty>
                        Tidak ada admin yang cocok atau semua admin sudah diberi
                        akses.
                      </CommandEmpty>
                      <CommandGroup heading="Admin tersedia">
                        {availableAdmins.map((admin) => (
                          <CommandItem
                            key={admin.id}
                            value={`${admin.name} ${admin.email}`}
                            onSelect={() => {
                              void addAccess(admin);
                            }}
                            className="items-center py-2"
                          >
                            <Avatar className="size-9 shrink-0">
                              <AvatarImage
                                src={admin.image ?? undefined}
                                alt={admin.name}
                              />
                              <AvatarFallback>
                                {admin.name
                                  .split(" ")
                                  .map((part) => part[0])
                                  .filter(Boolean)
                                  .slice(0, 2)
                                  .join("")
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                              <div className="flex items-center gap-2">
                                <span className="truncate font-medium">
                                  {admin.name}
                                </span>
                              </div>
                              <span className="truncate text-xs text-muted-foreground">
                                {admin.email}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">
                Ketik nama atau email untuk mencari admin dan tampilkan foto
                profilnya.
              </p>
            </div>

            <div className="space-y-2 ">
              <div className="space-y-2">
                {sortedAccesses.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                    Belum ada admin yang diberi akses untuk dinas ini.
                  </div>
                ) : (
                  sortedAccesses.map((access) => {
                    const isCurrentUser = access.userId === currentUserId;

                    return (
                      <div
                        key={access.id}
                        className="flex flex-col gap-3 rounded-lg border bg-background p-3"
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium">{access.user.name}</p>
                            {isCurrentUser ? (
                              <Badge variant="outline" size="sm">
                                Anda
                              </Badge>
                            ) : null}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {access.user.email}
                          </p>
                        </div>

                        <div className="flex justify-end">
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            disabled={isSaving || isCurrentUser}
                            onClick={() => {
                              void removeAccess(access);
                            }}
                          >
                            {isCurrentUser ? "Tidak dapat dihapus" : "Hapus"}
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
