"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Search, GraduationCap, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useInstitutionStore } from "@/stores/useInstitutionStore";
import type { Institution } from "@/interfaces/models";

/**
 * Admin page for managing institutions (schools, universities).
 *
 * @returns {React.JSX.Element} The rendered InstitutionsAdminPage component.
 */
export default function InstitutionsAdminPage() {
  const [search, setSearch] = useState("");
  
  // Dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  
  // Selected institution for edit/delete
  const [selectedInst, setSelectedInst] = useState<Institution | null>(null);
  
  // Form input state
  const [instName, setInstName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Zustand store
  const institutions = useInstitutionStore((s) => s.institutions);
  const loading = useInstitutionStore((s) => s.loading);
  const error = useInstitutionStore((s) => s.error);
  const fetchInstitutions = useInstitutionStore((s) => s.fetchInstitutions);
  const createInstitution = useInstitutionStore((s) => s.createInstitution);
  const updateInstitution = useInstitutionStore((s) => s.updateInstitution);
  const deleteInstitution = useInstitutionStore((s) => s.deleteInstitution);

  useEffect(() => {
    void fetchInstitutions();
  }, [fetchInstitutions]);

  // Filtered list based on search query
  const filteredInstitutions = useMemo(() => {
    if (!search.trim()) return institutions;
    return institutions.filter((inst) =>
      inst.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [institutions, search]);

  /**
   * Opens the create dialog and resets input.
   */
  function handleOpenCreate() {
    setInstName("");
    setCreateOpen(true);
  }

  /**
   * Opens the edit dialog and pre-fills the input.
   *
   * @param {Institution} inst - The institution to edit.
   */
  function handleOpenEdit(inst: Institution) {
    setSelectedInst(inst);
    setInstName(inst.name);
    setEditOpen(true);
  }

  /**
   * Opens the delete dialog.
   *
   * @param {Institution} inst - The institution to delete.
   */
  function handleOpenDelete(inst: Institution) {
    setSelectedInst(inst);
    setDeleteOpen(true);
  }

  /**
   * Handles creating a new institution.
   *
   * @param {React.FormEvent} e - Form event.
   */
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!instName.trim()) {
      toast.error("Nama institusi tidak boleh kosong");
      return;
    }
    setSubmitting(true);
    try {
      await createInstitution(instName.trim());
      toast.success("Institusi berhasil ditambahkan");
      setCreateOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal menambahkan institusi";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  /**
   * Handles updating an existing institution.
   *
   * @param {React.FormEvent} e - Form event.
   */
  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedInst) return;
    if (!instName.trim()) {
      toast.error("Nama institusi tidak boleh kosong");
      return;
    }
    setSubmitting(true);
    try {
      await updateInstitution(selectedInst.id, instName.trim());
      toast.success("Institusi berhasil diperbarui");
      setEditOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal memperbarui institusi";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  /**
   * Handles deleting an institution.
   */
  async function handleDelete() {
    if (!selectedInst) return;
    setSubmitting(true);
    try {
      await deleteInstitution(selectedInst.id);
      toast.success("Institusi berhasil dihapus");
      setDeleteOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal menghapus institusi";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-3xl font-bold tracking-tight">Institusi Asal</h1>
          <p className="text-muted-foreground text-sm">
            Kelola daftar institusi asal pemagang seperti sekolah atau universitas.
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="cursor-pointer">
          <Plus className="mr-2 size-4" />
          Tambah Institusi
        </Button>
      </div>

      <Card>
        <CardHeader className="p-4 md:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari institusi..."
              className="pl-9 h-10 w-full"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading && institutions.length === 0 ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : error ? (
            <div className="p-6 text-center text-sm text-destructive">
              Gagal memuat data institusi asal: {error}
            </div>
          ) : filteredInstitutions.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              {search ? "Institusi tidak ditemukan." : "Belum ada institusi terdaftar."}
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/30">
                    <th className="px-6 py-3.5 font-semibold text-muted-foreground">Nama Institusi</th>
                    <th className="px-6 py-3.5 font-semibold text-muted-foreground text-right w-36">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInstitutions.map((inst) => (
                    <tr key={inst.id} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground flex items-center gap-3">
                        <GraduationCap className="size-5 text-muted-foreground shrink-0" />
                        <span>{inst.name}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(inst)}
                            className="size-8 text-muted-foreground hover:text-foreground rounded-lg cursor-pointer"
                            title="Edit"
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDelete(inst)}
                            className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Institusi Asal</DialogTitle>
            <DialogDescription>
              Masukkan nama sekolah atau universitas asal pemagang yang baru.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => void handleCreate(e)} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="inst-name-create">Nama Institusi</Label>
              <Input
                id="inst-name-create"
                value={instName}
                onChange={(e) => setInstName(e.target.value)}
                placeholder="Contoh: Universitas Hasanuddin"
                disabled={submitting}
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} disabled={submitting} className="cursor-pointer">
                Batal
              </Button>
              <Button type="submit" loading={submitting} className="cursor-pointer">
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ubah Nama Institusi</DialogTitle>
            <DialogDescription>
              Ubah nama sekolah atau universitas asal pemagang ini.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => void handleUpdate(e)} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="inst-name-edit">Nama Institusi</Label>
              <Input
                id="inst-name-edit"
                value={instName}
                onChange={(e) => setInstName(e.target.value)}
                placeholder="Contoh: Universitas Hasanuddin"
                disabled={submitting}
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)} disabled={submitting} className="cursor-pointer">
                Batal
              </Button>
              <Button type="submit" loading={submitting} className="cursor-pointer">
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Institusi Asal?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus &ldquo;{selectedInst?.name}&rdquo;? Tindakan ini tidak dapat dibatalkan.
              Penghapusan hanya dapat dilakukan jika tidak ada pemagang yang sedang terdaftar menggunakan institusi asal ini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting} className="cursor-pointer">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleDelete();
              }}
              variant="destructive"
              loading={submitting}
              className="cursor-pointer"
            >
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
