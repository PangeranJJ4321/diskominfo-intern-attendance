"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil } from "lucide-react";
import { useInternStore } from "@/stores/useInternStore";
import { useAgencyStore } from "@/stores/useAgencyStore";
import { useInstitutionStore } from "@/stores/useInstitutionStore";
import { deleteIntern } from "@/lib/services/interns";
import { InternInfoCard } from "@/components/custom/intern-info-card";
import { CreateInternDialog } from "./create-intern-dialog";
import { EditInternDialog } from "./edit-intern-dialog";
import { toast } from "sonner";
import type { Intern } from "@/interfaces/models";
import type { InternCardProps } from "@/interfaces/profile";

/**
 * Checks whether the given intern record is currently active (today is within its date range).
 *
 * @param intern - The intern to check.
 * @returns True if the current date falls between startedAt and finishedAt (inclusive), or if finishedAt is null and today is on or after startedAt.
 */
function isInternActive(intern: Intern): boolean {
  const now = new Date();
  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();
  const started = new Date(intern.startedAt).getTime();
  if (intern.finishedAt) {
    const finished = new Date(intern.finishedAt).getTime();
    return today >= started && today <= finished;
  }
  return today >= started;
}

/**
 * Displays intern data for a user and allows create/edit/delete operations.
 * Shows "Edit" button when there is an active intern, "Tambah" button otherwise.
 *
 * Uses Zustand stores for interns, agencies, and institutions instead of direct API calls.
 *
 * @param {InternCardProps} props - The component props.
 * @param {string} props.userId - The user ID.
 * @returns {React.JSX.Element} The rendered intern card.
 */
export function InternCard({ userId }: InternCardProps) {
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  // ── Zustand stores ──
  const allInterns = useInternStore((s) => s.interns);
  const fetchInterns = useInternStore((s) => s.fetchInterns);
  const internsLoading = useInternStore((s) => s.loading);
  const agencies = useAgencyStore((s) => s.agencies);
  const fetchAgencies = useAgencyStore((s) => s.fetchAgencies);
  const agenciesLoading = useAgencyStore((s) => s.loading);
  const institutions = useInstitutionStore((s) => s.institutions);
  const fetchInstitutions = useInstitutionStore((s) => s.fetchInstitutions);
  const institutionsLoading = useInstitutionStore((s) => s.loading);

  // Combined loading from stores (no local loading state to avoid setState-in-effect)
  const loading = internsLoading || agenciesLoading || institutionsLoading;

  // Filter interns for this user
  const interns = useMemo(
    () => allInterns.filter((i) => i.userId === userId),
    [allInterns, userId],
  );

  /** The currently active intern, if any */
  const activeIntern = interns.find((i) => isInternActive(i)) ?? null;

  /**
   * Fetches all required data from the Zustand stores.
   */
  const refreshData = useCallback(async () => {
    try {
      await Promise.all([fetchInterns(), fetchAgencies(), fetchInstitutions()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data magang");
    }
  }, [fetchInterns, fetchAgencies, fetchInstitutions]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        await Promise.all([
          fetchInterns(),
          fetchAgencies(),
          fetchInstitutions(),
        ]);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Gagal memuat data magang",
          );
        }
        return;
      }

      if (cancelled) return;

      // Auto-open create dialog if no interns yet
      const currentInterns = useInternStore
        .getState()
        .interns.filter((i) => i.userId === userId);
      if (currentInterns.length === 0) {
        if (!cancelled) setCreateOpen(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, fetchInterns, fetchAgencies, fetchInstitutions]);

  /**
   * Handles successful intern creation.
   */
  function handleCreate() {
    setCreateOpen(false);
    toast.success("Data magang berhasil ditambahkan");
    void refreshData();
  }

  /**
   * Handles successful intern update.
   */
  function handleEdit() {
    setEditOpen(false);
    toast.success("Data magang berhasil diperbarui");
    void refreshData();
  }

  /**
   * Handles intern deletion with confirmation.
   *
   * @param internId - The ID of the intern to delete.
   */
  async function handleDelete(internId: string) {
    try {
      await deleteIntern(internId);
      // Refresh store after deletion
      await fetchInterns();
      setEditOpen(false);
      toast.success("Data magang berhasil dihapus");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal menghapus data magang",
      );
    }
  }

  /**
   * Opens the appropriate dialog based on whether there is an active intern.
   */
  function openDialog() {
    if (activeIntern) {
      setEditOpen(true);
    } else {
      setCreateOpen(true);
    }
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
          <Button variant="outline" size="sm" onClick={openDialog}>
            {activeIntern ? (
              <>
                <Pencil className="mr-1.5 h-4 w-4" />
                Edit
              </>
            ) : (
              <>
                <Plus className="mr-1.5 h-4 w-4" />
                Tambah
              </>
            )}
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

        {/* Edit Intern Dialog (only when there is an active intern) */}
        {activeIntern && (
          <EditInternDialog
            intern={activeIntern}
            agencies={agencies}
            institutions={institutions}
            onSuccess={handleEdit}
            onDelete={handleDelete}
            open={editOpen}
            onOpenChange={setEditOpen}
          />
        )}
      </CardContent>
    </Card>
  );
}

export default InternCard;
