"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { getAgency } from "@/lib/services/agencies";
import { useAgencyStore } from "@/stores/useAgencyStore";
import { useAgencyAccessStore } from "@/stores/useAgencyAccessStore";

interface AgencyDetailsCardProps {
  agencyId: string;
}

/**
 * Renders a card allowing admins to edit the agency name or delete the agency.
 *
 * @param {AgencyDetailsCardProps} props - Component props.
 * @returns {React.JSX.Element} The rendered AgencyDetailsCard component.
 */
export default function AgencyDetailsCard({ agencyId }: AgencyDetailsCardProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  const updateAgency = useAgencyStore((s) => s.updateAgency);
  const deleteAgency = useAgencyStore((s) => s.deleteAgency);
  const fetchAccesses = useAgencyAccessStore((s) => s.fetchAccesses);

  useEffect(() => {
    let active = true;
    async function loadAgency() {
      try {
        const data = await getAgency(agencyId);
        if (active) {
          setName(data.name);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Gagal memuat data instansi");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    void loadAgency();
    return () => {
      active = false;
    };
  }, [agencyId]);

  /**
   * Saves the updated agency name.
   */
  async function handleSave() {
    if (!name.trim()) {
      toast.error("Nama instansi tidak boleh kosong");
      return;
    }
    setIsSaving(true);
    try {
      await updateAgency(agencyId, name.trim());
      // Refresh accesses to update name in sidebar/dropdown
      await fetchAccesses();
      toast.success("Nama instansi berhasil diperbarui");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memperbarui nama instansi");
    } finally {
      setIsSaving(false);
    }
  }

  /**
   * Deletes the current agency.
   */
  async function handleDelete() {
    setIsDeleting(true);
    try {
      await deleteAgency(agencyId);
      toast.success("Instansi berhasil dihapus");
      // Refresh accesses
      await fetchAccesses();
      // Redirect to main admin page which will handle routing to other available agency
      router.replace("/admin");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus instansi");
    } finally {
      setIsDeleting(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72 mt-1" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <div className="flex justify-between">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Detail Instansi</CardTitle>
        <CardDescription>
          Kelola informasi nama instansi atau hapus instansi ini jika sudah tidak aktif.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error ? (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="agency-name">Nama Instansi</Label>
              <Input
                id="agency-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masukkan nama instansi..."
                disabled={isSaving || isDeleting}
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-between gap-4 pt-2">
              <Button onClick={handleSave} loading={isSaving} disabled={isDeleting}>
                Simpan Perubahan
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isSaving || isDeleting} className="w-full sm:w-auto">
                    <Trash2 className="mr-2 size-4" />
                    Hapus Instansi
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Apakah Anda benar-benar yakin?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tindakan ini tidak dapat dibatalkan. Menghapus instansi ini akan menghapus semua
                      data konfigurasinya secara permanen dari sistem. Anda hanya dapat menghapus instansi
                      yang sudah tidak memiliki pemagang (intern) aktif maupun riwayat magang.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      variant="destructive"
                      loading={isDeleting}
                    >
                      Ya, Hapus Instansi
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
