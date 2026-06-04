"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { defaultAgencyRuleData } from "@/lib/schemas/agency-rule";

export function RequireWithinAreaSwitch({
  agencyId,
  initialValue,
  disabled = false,
  onSuccess,
}: {
  agencyId?: string | null;
  initialValue: boolean;
  disabled?: boolean;
  onSuccess?: (value: boolean) => void;
}) {
  const t = useTranslations();
  const [checked, setChecked] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(false);

  async function handleCheckedChange(next: boolean) {
    if (isLoading || disabled) return;
    if (!agencyId) {
      toast.error("Agency ID belum tersedia");
      return;
    }

    setChecked(next);
    setIsLoading(true);

    try {
      let hasRule = false;
      try {
        const resp = await fetch(`/api/agency-rules/${agencyId}`);
        if (resp.ok) {
          const json = await resp.json().catch(() => null);
          hasRule = Boolean(json);
        }
      } catch {
        // ignore
      }

      if (!hasRule) {
        const createResp = await fetch(`/api/agency-rules/${agencyId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requireFaceVerification:
              defaultAgencyRuleData.requireFaceVerification,
            requireWithinArea: next,
            lateToleranceMinutes: defaultAgencyRuleData.lateToleranceMinutes,
          }),
        });

        if (!createResp.ok) throw new Error("Gagal membuat aturan");
        await createResp.json().catch(() => null);
        toast.success("Aturan dinas berhasil dibuat");
        onSuccess?.(next);
        return;
      }

      const updateResp = await fetch(`/api/agency-rules/${agencyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requireWithinArea: next }),
      });

      if (!updateResp.ok) throw new Error("Gagal menyimpan aturan");
      onSuccess?.(next);
      toast.success("Aturan dinas berhasil diperbarui");
    } catch (err) {
      console.error("RequireWithinAreaSwitch error:", err);
      setChecked((prev) => !prev);
      toast.error(t("Gagal menyimpan aturan dinas"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="rounded-xl border bg-muted/30 p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <Label
            htmlFor="requireWithinArea"
            className="text-base font-semibold"
          >
            Kehadiran Dalam Area
          </Label>
          <p className="text-sm text-muted-foreground">
            Hanya izinkan check-in saat pengguna berada di area dinas.
          </p>
        </div>
        <Switch
          id="requireWithinArea"
          checked={checked}
          onCheckedChange={handleCheckedChange}
          disabled={disabled || isLoading}
        />
      </div>
    </div>
  );
}
