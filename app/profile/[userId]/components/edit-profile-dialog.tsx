"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Pencil, Lock, User } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { fetchUser } from "@/lib/services/users";
import type { EditProfileDialogProps } from "@/interfaces/profile";

export function EditProfileDialog({
  userId,
  initialName,
  hasCredentialAccount,
  onSuccess,
}: EditProfileDialogProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("account");

  // Account info state
  const [name, setName] = useState(initialName);
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountError, setAccountError] = useState("");

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (!nextOpen) {
      // Reset form when closing
      setName(initialName);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setAccountError("");
      setPasswordError("");
      setActiveTab("account");
    }
  };

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccountError("");

    if (!name || name.length < 2) {
      setAccountError("Nama minimal harus 2 karakter");
      return;
    }

    setAccountLoading(true);
    try {
      await authClient.updateUser({
        name,
      });
      const updatedUser = await fetchUser(userId);
      onSuccess(updatedUser);
      toast.success("Informasi akun berhasil diperbarui");
      setOpen(false);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan yang tidak terduga";
      setAccountError(message);
      toast.error(message);
    } finally {
      setAccountLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    if (newPassword.length < 8) {
      setPasswordError("Password harus minimal 8 karakter");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Password baru tidak cocok");
      return;
    }

    setPasswordLoading(true);
    try {
      const { error } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });

      if (error) {
        throw new Error(error.message || "Gagal mengubah password");
      }

      toast.success("Password berhasil diubah");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordError("");
      setOpen(false);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan yang tidak terduga";
      setPasswordError(message);
      toast.error(message);
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Pencil className="h-4 w-4" />
          Edit profil
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90dvh] overflow-y-auto scrollbar-none p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Edit Profil</DialogTitle>
          <DialogDescription>
            Update detail profil Anda atau ubah password.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="account" className="gap-2">
              <User className="h-4 w-4" />
              Detail profil
            </TabsTrigger>
            <TabsTrigger value="password" className="gap-2">
              <Lock className="h-4 w-4" />
              Password
            </TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="mt-4">
            <form onSubmit={handleAccountSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama lengkap</Label>
                <InputGroup>
                  <InputGroupInput
                    id="name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setAccountError("");
                    }}
                    disabled={accountLoading}
                    placeholder="Masukkan nama lengkap anda"
                  />
                </InputGroup>
              </div>

              {accountError ? (
                <p className="text-sm text-red-500">{accountError}</p>
              ) : null}

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={accountLoading}
                >
                  Batal
                </Button>
                <Button type="submit" loading={accountLoading}>
                  Simpan perubahan
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="password" className="mt-4">
            {!hasCredentialAccount ? (
              <div className="rounded-lg border bg-muted/50 p-4 text-center">
                <Lock className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Anda tidak memiliki password. Anda sign-in menggunakan akun
                  sosial.
                </p>
              </div>
            ) : (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Password saat ini</Label>
                  <InputGroup>
                    <InputGroupInput
                      id="current-password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => {
                        setCurrentPassword(e.target.value);
                        setPasswordError("");
                      }}
                      disabled={passwordLoading}
                      placeholder="Masukkan password saat ini"
                    />
                  </InputGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">Password baru</Label>
                  <InputGroup>
                    <InputGroupInput
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setPasswordError("");
                      }}
                      disabled={passwordLoading}
                      placeholder="Masukkan password baru (minimal 8 karakter)"
                    />
                  </InputGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">
                    Konfirmasi password baru
                  </Label>
                  <InputGroup>
                    <InputGroupInput
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setPasswordError("");
                      }}
                      disabled={passwordLoading}
                      placeholder="Masukkan konfirmasi password baru"
                    />
                  </InputGroup>
                </div>

                {passwordError ? (
                  <p className="text-sm text-red-500">{passwordError}</p>
                ) : null}

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                    disabled={passwordLoading}
                  >
                    Batal
                  </Button>
                  <Button type="submit" loading={passwordLoading}>
                    Simpan perubahan
                  </Button>
                </div>
              </form>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
