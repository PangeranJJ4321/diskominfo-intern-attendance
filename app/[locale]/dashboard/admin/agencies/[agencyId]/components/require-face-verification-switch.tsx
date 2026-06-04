"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { defaultAgencyRuleData } from "@/lib/schemas/agency-rule";

/**
 * Self-contained toggle that updates the agency rule on the server for
 * requireFaceVerification. It will create the rule if it doesn't exist yet.
 */
export function RequireFaceVerificationSwitch({
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

  // no-op: we don't need to inspect the created payload in this component —
  // success is indicated by an OK response from the server.

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
        // ignore — we'll try to create
      }

      if (!hasRule) {
        const createResp = await fetch(`/api/agency-rules/${agencyId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requireFaceVerification: next,
            requireWithinArea: defaultAgencyRuleData.requireWithinArea,
            lateToleranceMinutes: defaultAgencyRuleData.lateToleranceMinutes,
          }),
        });

        if (!createResp.ok) {
          throw new Error("Gagal membuat aturan");
        }

        await createResp.json().catch(() => null);
        toast.success("Aturan dinas berhasil dibuat");
        onSuccess?.(next);
        return;
      }

      const updateResp = await fetch(`/api/agency-rules/${agencyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requireFaceVerification: next }),
      });

      if (!updateResp.ok) {
        throw new Error("Gagal menyimpan aturan");
      }

      onSuccess?.(next);
      toast.success("Aturan dinas berhasil diperbarui");
    } catch (err) {
      console.error("RequireFaceVerificationSwitch error:", err);
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
            htmlFor="requireFaceVerification"
            className="text-base font-semibold"
          >
            Verifikasi Wajah Diperlukan
          </Label>
          <p className="text-sm text-muted-foreground">
            Wajib melakukan verifikasi wajah untuk pencatatan kehadiran.
          </p>
        </div>
        <Switch
          id="requireFaceVerification"
          checked={checked}
          onCheckedChange={handleCheckedChange}
          disabled={disabled || isLoading}
        />
      </div>
    </div>
  );
}
