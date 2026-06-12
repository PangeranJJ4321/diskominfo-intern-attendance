"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil } from "lucide-react";
import { getInstitutions } from "@/lib/services/institutions";
import { deleteIntern } from "@/lib/services/interns";
import { useInternStore } from "@/stores/intern-store";
import { useAgencyStore } from "@/stores/agency-store";
import { InternInfoCard } from "@/components/custom/intern-info-card";
import { CreateInternDialog } from "./create-intern-dialog";
import { EditInternDialog } from "./edit-intern-dialog";
import { toast } from "sonner";
import type { Intern, Institution } from "@/interfaces/models";
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
 * @param {InternCardProps} props - The component props.
 * @param {string} props.userId - The user ID.
 * @param {function} [props.onInternsChange] - Callback when interns list changes.
 * @returns {React.JSX.Element} The rendered intern card.
 */
export function InternCard({ userId }: InternCardProps) {
  const [loading, setLoading] = useState(true);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  // ── Intern store ──
  const internsAll = useInternStore((s) => s.interns);
  const fetchInterns = useInternStore((s) => s.fetchInterns);
  const addIntern = useInternStore((s) => s.addIntern);
  const updateIntern = useInternStore((s) => s.updateIntern);
  const removeIntern = useInternStore((s) => s.removeIntern);

  // ── Agency store ──
  const agencies = useAgencyStore((s) => s.agencies);
  const fetchAgencies = useAgencyStore((s) => s.fetchAgencies);

  const userInterns = internsAll.filter((i) => i.userId === userId);

  /** The currently active intern, if any */
  const activeIntern = userInterns.find((i) => isInternActive(i)) ?? null;

  /**
   * Loads intern, agency, and institution data from stores/API.
   * Returns the institutions list so callers can decide what to do with it.
   */
  const loadData = useCallback(async () => {
    const [, , institutionsData] = await Promise.all([
      fetchInterns(),
      fetchAgencies(),
      getInstitutions(),
    ]);
    return institutionsData;
  }, [fetchInterns, fetchAgencies]);

  useEffect(() => {
    let cancelled = false;

    loadData()
      .then((institutionsData) => {
        if (cancelled) return;
        setInstitutions(institutionsData);
        const freshUserInterns = useInternStore
          .getState()
          .interns.filter((i) => i.userId === userId);
        if (freshUserInterns.length === 0) {
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
  }, [userId, loadData]);

  /**
   * Handles successful intern creation. Adds the new intern to the Zustand store
   * to avoid a full re-fetch.
   *
   * @param intern - The newly created intern record.
   */
  function handleCreate(intern: Intern) {
    addIntern(intern);
    setCreateOpen(false);
    toast.success("Data magang berhasil ditambahkan");
  }

  /**
   * Handles successful intern update. Updates the intern in the Zustand store
   * to avoid a full re-fetch.
   *
   * @param intern - The updated intern record.
   */
  function handleEdit(intern: Intern) {
    updateIntern(intern);
    setEditOpen(false);
    toast.success("Data magang berhasil diperbarui");
  }

  /**
   * Handles intern deletion with confirmation. Removes the intern from the
   * Zustand store (no re-fetch needed — store reactively updates the UI).
   *
   * @param internId - The ID of the intern to delete.
   */
  async function handleDelete(internId: string) {
    try {
      await deleteIntern(internId);
      removeIntern(internId);
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
              onClick={() => {
                setError("");
                loadData()
                  .then((institutionsData) => setInstitutions(institutionsData))
                  .catch((err) =>
                    setError(
                      err instanceof Error
                        ? err.message
                        : "Gagal memuat data magang",
                    ),
                  );
              }}
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

        {userInterns.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Belum ada data magang. Klik tombol &ldquo;Tambah&rdquo; untuk
            mendaftarkan magang Anda.
          </p>
        ) : (
          <div className="space-y-4">
            {userInterns.map((intern) => (
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
