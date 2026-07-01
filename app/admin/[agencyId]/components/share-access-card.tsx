"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { Trash2, Search } from "lucide-react";

import { useSession } from "@/lib/auth-client";
import {
  getAccesses,
  createAccess,
  deleteAccess,
} from "@/lib/services/accesses";
import { getUsers } from "@/lib/services/users";
import type { User, AdminAccess } from "@/interfaces/models";

interface ShareAccessCardProps {
  agencyId: string;
}

export default function ShareAccessCard({ agencyId }: ShareAccessCardProps) {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id || "";
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingAccessId, setDeletingAccessId] = useState<string | null>(null);
  const [isUserSearchOpen, setIsUserSearchOpen] = useState(false);
  const [accesses, setAccesses] = useState<AdminAccess[]>([]);
  const [admins, setAdmins] = useState<User[]>([]);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [loadedAccesses, loadedUsers] = await Promise.all([
          getAccesses(),
          getUsers(),
        ]);
        setAccesses(loadedAccesses);
        setAdmins(loadedUsers);
      } catch (err) {
        console.error("Gagal memuat data akses", err);
        toast.error("Gagal memuat data akses");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const myAgencyAccesses = useMemo(
    () => accesses.filter((access) => access.agencyId === agencyId),
    [accesses, agencyId],
  );

  const accessUserIds = useMemo(
    () => new Set(myAgencyAccesses.map((access) => access.userId)),
    [myAgencyAccesses],
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
      [...myAgencyAccesses].sort((left, right) =>
        (left.user?.name || "").localeCompare(right.user?.name || ""),
      ),
    [myAgencyAccesses],
  );
  /**
   * Adds access for a new administrator.
   *
   * @param admin - The user to grant admin access to.
   */
  const addAccess = async (admin: User) => {
    if (isSaving) return;

    if (admin.id === currentUserId) {
      toast.error("Anda tidak dapat menambahkan akses untuk diri sendiri.");
      return;
    }

    if (accessUserIds.has(admin.id)) {
      toast.info("Admin ini sudah memiliki akses.");
      return;
    }

    setIsSaving(true);
    setIsUserSearchOpen(false);

    try {
      const newAccess = await createAccess(agencyId, admin.id);

      setAccesses((currentAccesses) => [...currentAccesses, newAccess]);
      toast.success(`Akses admin untuk ${admin.name} berhasil ditambahkan`);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Gagal menambahkan akses admin";
      toast.error(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Removes access for an administrator.
   *
   * @param access - The access record to delete.
   */
  const removeAccess = async (access: AdminAccess) => {
    if (isSaving) return;

    if (access.userId === currentUserId) {
      toast.error("Anda tidak dapat menghapus akses Anda sendiri.");
      return;
    }

    setIsSaving(true);
    setDeletingAccessId(access.id);

    try {
      await deleteAccess(access.id);
      setAccesses((currentAccesses) =>
        currentAccesses.filter((item) => item.id !== access.id),
      );
      toast.success(
        `Akses admin untuk ${access.user?.name || "Mahasiswa Intern"} berhasil dihapus`,
      );
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Gagal menghapus akses admin";
      toast.error(errorMsg);
    } finally {
      setIsSaving(false);
      setDeletingAccessId(null);
    }
  };

  if (isLoading) {
    return (
      <Card className="overflow-hidden p-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-9 w-full rounded-lg" />
            </div>
            <div className="space-y-3 pt-2">
              <Skeleton className="h-3 w-40" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 border border-border/60 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Skeleton className="size-10 rounded-full" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3.5 w-40" />
                      </div>
                    </div>
                    <Skeleton className="size-8 rounded-lg" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden p-6">
      <div className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Akses Admin</h2>
          <p className="text-sm text-muted-foreground">
            Kelola administrator yang dapat mengakses dan mengubah pengaturan
            sistem presensi. Akses Anda sendiri tidak dapat dihapus dari halaman
            ini.
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Cari Administrator
              </Label>
              <Popover
                open={isUserSearchOpen}
                onOpenChange={setIsUserSearchOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-between text-left font-normal rounded-lg border-border bg-background/50 hover:bg-background px-4 py-2 text-sm shadow-sm transition-all hover:border-foreground/20 focus-visible:ring-primary/40"
                    disabled={isSaving}
                  >
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Search className="size-4 shrink-0" />
                      {availableAdmins.length === 0
                        ? "Tidak ada admin lain yang tersedia"
                        : "Pilih admin untuk diberi akses..."}
                    </span>
                    {isSaving && <Spinner className="size-4" />}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-80 sm:w-96 p-0 rounded-lg border border-border bg-card shadow-md"
                  align="start"
                >
                  <Command className="rounded-lg">
                    <CommandInput
                      placeholder="Cari berdasarkan nama atau email..."
                      className="border-0 focus:ring-0 text-sm"
                    />
                    <CommandList className="max-h-56">
                      <CommandEmpty className="p-3 text-xs text-center text-muted-foreground">
                        Tidak ada admin yang cocok atau semua admin sudah diberi
                        akses.
                      </CommandEmpty>
                      <CommandGroup
                        heading="Admin tersedia"
                        className="px-1 text-xs text-muted-foreground"
                      >
                        {availableAdmins.map((admin) => (
                          <CommandItem
                            key={admin.id}
                            value={`${admin.name} ${admin.email}`}
                            onSelect={() => {
                              void addAccess(admin);
                            }}
                            className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted/80 cursor-pointer transition-all"
                          >
                            <Avatar className="size-8 shrink-0">
                              <AvatarImage
                                src={admin.image || undefined}
                                alt={admin.name}
                              />
                              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
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
                              <span className="truncate font-medium text-foreground text-sm">
                                {admin.name}
                              </span>
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
              <p className="text-xs text-muted-foreground/85">
                Pilih dari daftar administrator yang tersedia di sistem untuk
                mendaftarkannya sebagai pengelola.
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Akses Terdaftar ({sortedAccesses.length})
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sortedAccesses.length === 0 ? (
                  <div className="col-span-full rounded-lg border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
                    Belum ada administrator yang memiliki akses.
                  </div>
                ) : (
                  sortedAccesses.map((access) => {
                    const isCurrentUser = access.userId === currentUserId;

                    return (
                      <div
                        key={access.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/50 p-3 shadow-sm hover:shadow-md transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="size-10 shrink-0 border border-border/40">
                            <AvatarImage
                              src={access.user?.image || undefined}
                              alt={access.user?.name || ""}
                            />
                            <AvatarFallback className="bg-muted text-muted-foreground text-xs font-bold">
                              {(access.user?.name || "")
                                .split(" ")
                                .map((part) => part[0])
                                .filter(Boolean)
                                .slice(0, 2)
                                .join("")
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-sm text-foreground/90 truncate">
                                {access.user?.name}
                              </p>
                              {isCurrentUser && (
                                <Badge
                                  variant="outline"
                                  className="text-xs py-0"
                                >
                                  Anda
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {access.user?.email}
                            </p>
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          loading={deletingAccessId === access.id}
                          disabled={isSaving || isCurrentUser}
                          onClick={() => {
                            void removeAccess(access);
                          }}
                          className={`size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/15 transition-all rounded-lg shrink-0 ${isCurrentUser ? "opacity-30 cursor-not-allowed hover:bg-transparent" : ""}`}
                          title={
                            isCurrentUser
                              ? "Tidak dapat menghapus akses sendiri"
                              : "Hapus Akses"
                          }
                        >
                          <Trash2 className="size-4" />
                        </Button>
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
