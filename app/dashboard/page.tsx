"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { useInternStore } from "@/stores/useInternStore";
import { Navbar } from "@/components/custom/navbar";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Dashboard landing page — redirects to the intern's specific dashboard
 * based on their intern ID. If no intern data is available, redirects to
 * the profile page instead.
 *
 * Uses Zustand store for interns instead of direct API calls.
 *
 * @returns {React.JSX.Element} A loading skeleton or redirect.
 */
export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Zustand store for interns
  const fetchInterns = useInternStore((s) => s.fetchInterns);

  useEffect(() => {
    if (sessionPending) return;

    async function redirectToInternDashboard() {
      try {
        await fetchInterns();
        // Re-read from store after fetch
        const freshInterns = useInternStore.getState().interns;
        const intern = freshInterns.find((i) => i.userId === session?.user?.id);
        if (intern) {
          router.replace(`/dashboard/${intern.id}`);
          return;
        }
        // No intern data — redirect to profile
        if (session?.user?.id) {
          router.replace(`/profile/${session.user.id}`);
          return;
        }
        setError("Data pemagang tidak ditemukan. Harap lengkapi profil Anda.");
      } catch (err) {
        console.error("Failed to fetch interns:", err);
        setError("Gagal memuat data pemagang.");
      } finally {
        setLoading(false);
      }
    }

    void redirectToInternDashboard();
  }, [sessionPending, session, router, fetchInterns]);

  return (
    <>
      <Navbar />
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Dashboard Presensi
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm">
            Memuat data dashboard...
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
