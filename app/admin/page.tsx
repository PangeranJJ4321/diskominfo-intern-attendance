"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { useAgencyAccessStore } from "@/stores/useAgencyAccessStore";
import { Navbar } from "@/components/custom/navbar";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Admin landing page — redirects to the first agency the admin has access to.
 * If no agency access is found, shows a fallback message.
 *
 * Uses Zustand store for agency accesses instead of direct API calls.
 *
 * @returns {React.JSX.Element} A loading skeleton or redirect.
 */
export default function AdminPage() {
  const router = useRouter();
  const { isPending: sessionPending } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Zustand store for agency accesses
  const fetchAccesses = useAgencyAccessStore((s) => s.fetchAccesses);

  useEffect(() => {
    if (sessionPending) return;

    async function redirectToFirstAgency() {
      try {
        await fetchAccesses();
        const freshAccesses = useAgencyAccessStore.getState().accesses;
        if (freshAccesses.length > 0 && freshAccesses[0].agencyId) {
          router.replace(`/admin/${freshAccesses[0].agencyId}`);
          return;
        }
        setError(
          "Anda tidak memiliki akses ke instansi manapun. Hubungi administrator untuk mendapatkan akses.",
        );
      } catch (err) {
        console.error("Failed to fetch agency accesses:", err);
        setError("Gagal memuat data akses instansi.");
      } finally {
        setLoading(false);
      }
    }

    void redirectToFirstAgency();
  }, [sessionPending, router, fetchAccesses]);

  return (
    <>
      <Navbar />
      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-3xl font-bold tracking-tight">
            Pengaturan Admin
          </h1>
          <p className="text-muted-foreground text-sm">
            Atur aturan presensi, area geografis presensi, jadwal operasional,
            shift, presensi pengguna, hari libur, dan akses administrator.
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
            <p className="text-destructive font-medium">{error}</p>
          </div>
        ) : null}
      </main>
    </>
  );
}
