"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { unlinkAccount } from "@/lib/services/users";
import { authClient } from "@/lib/auth-client";
import { type AccountConnectionsCardProps } from "@/interfaces/profile";
import { Key, Globe2, Link2Off, CheckCircle2 } from "lucide-react";

export function AccountConnectionsCard({
  user,
  onUpdate,
}: AccountConnectionsCardProps) {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  const hasCredential = user.accounts.some(
    (acc) => acc.providerId === "credential",
  );
  const hasGoogle = user.accounts.some((acc) => acc.providerId === "google");

  /**
   * Unlinks an external auth provider account from the current user.
   *
   * @param {string} providerId - The provider ID to unlink (e.g. "google").
   * @returns {Promise<void>} Resolves when the account is unlinked and the UI is updated.
   */
  const handleUnlink = async (providerId: string) => {
    // Prevent unlinking if it's the last remaining login method
    if (user.accounts.length <= 1) {
      toast.error(
        "Tidak dapat memutuskan metode masuk terakhir Anda. Harap tambahkan metode lain terlebih dahulu.",
      );
      return;
    }

    setLoadingProvider(providerId);
    try {
      const updatedUser = await unlinkAccount(user.id, providerId);
      onUpdate(updatedUser);
      toast.success(
        `Akun ${providerId === "google" ? "Google" : "Password"} berhasil diputuskan`,
      );
    } catch {
      toast.error("Gagal memutuskan hubungan akun");
    } finally {
      setLoadingProvider(null);
    }
  };

  /**
   * Initiates the BetterAuth OAuth flow to link a social provider account.
   * Redirects the user to the provider's authorization page.
   *
   * @param {string} provider - The social provider ID to link (e.g. "google").
   * @returns {Promise<void>} Resolves after the redirect is initiated.
   */
  const handleLinkSocial = async (provider: string) => {
    setLoadingProvider(provider);
    try {
      const { data, error } = await authClient.linkSocial({
        provider: provider as "google",
        callbackURL: window.location.href,
      });

      if (error) {
        toast.error(error.message || "Gagal menghubungkan akun");
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch {
      toast.error("Gagal menghubungkan akun");
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Akun terhubung</CardTitle>
        <CardDescription>
          Kelola akun autentikasi eksternal dan metode masuk.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Credentials login */}
        <div className="flex items-center justify-between p-3 border rounded-lg bg-background">
          <div className="flex items-center gap-3">
            <div className="p-2 border rounded-md bg-muted">
              <Key className="h-5 w-5 text-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">Masuk dengan Password</p>
              <p className="text-xs text-muted-foreground">
                {hasCredential ? "Aktif" : "Belum dikonfigurasi"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasCredential ? (
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-1 rounded-full">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Aktif
              </span>
            ) : (
              <Button size="sm" variant="outline">
                Konfigurasi
              </Button>
            )}
          </div>
        </div>

        {/* Google OAuth */}
        <div className="flex items-center justify-between p-3 border rounded-lg bg-background">
          <div className="flex items-center gap-3">
            <div className="p-2 border rounded-md bg-muted">
              <Globe2 className="h-5 w-5 text-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">Akun Google</p>
              <p className="text-xs text-muted-foreground">
                {hasGoogle ? "Terhubung" : "Belum terhubung"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasGoogle ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleUnlink("google")}
                disabled={loadingProvider !== null}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Link2Off className="h-4 w-4 mr-1.5" />
                {loadingProvider === "google" ? "Memutuskan..." : "Putuskan"}
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleLinkSocial("google")}
                disabled={loadingProvider !== null}
              >
                {loadingProvider === "google"
                  ? "Menghubungkan..."
                  : "Hubungkan"}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
