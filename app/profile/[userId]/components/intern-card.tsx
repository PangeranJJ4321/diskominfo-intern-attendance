"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";
import { getInterns } from "@/lib/services/interns";
import { getAgencies } from "@/lib/services/agencies";
import { getInstitutions } from "@/lib/services/institutions";
import { InternInfoCard } from "@/components/custom/intern-info-card";
import { CreateInternDialog } from "./create-intern-dialog";
import { toast } from "sonner";
import type { Intern, Agency, Institution } from "@/interfaces/models";
import type { InternCardProps } from "@/interfaces/profile";

/**
 * Displays intern data for a user and allows create/edit/delete operations.
 *
 * @param {InternCardProps} props - The component props.
 * @param {string} props.userId - The user ID.
 * @param {function} [props.onInternsChange] - Callback when interns list changes.
 * @returns {React.JSX.Element} The rendered intern card.
 */
export function InternCard({ userId, onInternsChange }: InternCardProps) {
  const [loading, setLoading] = useState(true);
  const [interns, setInterns] = useState<Intern[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  /**
   * Fetches all required data from the API without setting state.
   *
   * @returns The fetched interns, agencies, and institutions.
   */
  async function fetchAllData() {
    const [internsData, agenciesData, institutionsData] = await Promise.all([
      getInterns(),
      getAgencies(),
      getInstitutions(),
    ]);
    const userInterns = internsData.filter((i) => i.userId === userId);
    return { userInterns, agenciesData, institutionsData };
  }

  /**
   * Applies fetched data to component state.
   *
   * @param data - The fetched data to apply.
   */
  function applyData(data: {
    userInterns: Intern[];
    agenciesData: Agency[];
    institutionsData: Institution[];
  }) {
    setInterns(data.userInterns);
    setAgencies(data.agenciesData);
    setInstitutions(data.institutionsData);
    onInternsChange?.(data.userInterns);
  }

  useEffect(() => {
    let cancelled = false;

    fetchAllData()
      .then((data) => {
        if (cancelled) return;
        applyData(data);
        if (data.userInterns.length === 0) {
          setCreateOpen(true);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Gagal memuat data magang",
        );
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  /**
   * Refreshes all data after a mutation (create, update, or delete).
   */
  async function refreshData() {
    setError("");
    setLoading(true);
    try {
      const data = await fetchAllData();
      applyData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data magang");
    } finally {
      setLoading(false);
    }
  }

  /**
   * Handles successful intern creation.
   *
   * @param _intern - The created intern (unused, kept for callback compatibility).
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function handleCreate(_intern: Intern) {
    setCreateOpen(false);
    toast.success("Data magang berhasil ditambahkan");
    void refreshData();
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-9 w-36" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/20 bg-destructive/5">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-destructive">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refreshData()}
            >
              Coba lagi
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Data Magang</h2>
            <p className="text-sm text-muted-foreground">
              Kelola institusi dan instansi magang Anda.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Tambah
          </Button>
        </div>

        {interns.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Belum ada data magang. Klik tombol &ldquo;Tambah&rdquo; untuk
            mendaftarkan magang Anda.
          </p>
        ) : (
          <div className="space-y-4">
            {interns.map((intern) => (
              <InternInfoCard key={intern.id} userId={userId} />
            ))}
          </div>
        )}

        {/* Create Intern Dialog */}
        <CreateInternDialog
          userId={userId}
          agencies={agencies}
          institutions={institutions}
          onSuccess={handleCreate}
          open={createOpen}
          onOpenChange={setCreateOpen}
        />
      </CardContent>
    </Card>
  );
}

export default InternCard;
