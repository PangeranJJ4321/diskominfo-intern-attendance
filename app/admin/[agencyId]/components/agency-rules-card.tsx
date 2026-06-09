"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  getAgencyRule,
  createAgencyRule,
  updateAgencyRule,
} from "@/lib/services/agencies";
import type { AgencyRule } from "@/interfaces/models";

interface AgencyRulesCardProps {
  agencyId: string;
}

/**
 * Card component displaying toggles for agency attendance rules.
 *
 * @param {AgencyRulesCardProps} props - The component props.
 * @param {string} props.agencyId - The agency ID.
 * @returns {React.JSX.Element} The rendered agency rules card.
 */
export default function AgencyRulesCard({ agencyId }: AgencyRulesCardProps) {
  const [loading, setLoading] = useState(true);
  const [rule, setRule] = useState<AgencyRule | null>(null);
  const [error, setError] = useState("");
  const [toggling, setToggling] = useState<"face" | "area" | null>(null);

  useEffect(() => {
    let active = true;

    async function loadRule() {
      if (!agencyId) return;
      try {
        const data = await getAgencyRule(agencyId);
        if (active) {
          setRule(data);
        }
      } catch (err) {
        if (active) {
          const message =
            err instanceof Error ? err.message : "Gagal memuat aturan instansi";
          setError(message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadRule();

    return () => {
      active = false;
    };
  }, [agencyId]);

  /**
   * Handles toggling a specific rule field.
   *
   * @param field - The field to toggle.
   */
  async function handleToggle(
    field: "requireFaceVerification" | "requireWithinArea",
  ) {
    setToggling(field === "requireFaceVerification" ? "face" : "area");

    try {
      if (rule?.id) {
        const currentValue = rule[field];
        const updated = await updateAgencyRule(agencyId, {
          [field]: !currentValue,
        });
        setRule(updated);
        toast.success("Aturan instansi berhasil diperbarui");
      } else {
        const created = await createAgencyRule(agencyId, {
          [field]: true,
        });
        setRule(created);
        toast.success("Aturan instansi berhasil dibuat");
      }
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Gagal memperbarui aturan instansi",
      );
    } finally {
      setToggling(null);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-64" />
            <Skeleton className="h-6 w-10 rounded-full" />
          </div>
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-64" />
            <Skeleton className="h-6 w-10 rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !rule) {
    return (
      <Card className="border-destructive/20 bg-destructive/5">
        <CardContent className="p-6">
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Aturan Presensi</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Require Face Verification Toggle */}
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <Label
              htmlFor="toggle-face"
              className="text-sm font-medium cursor-pointer"
            >
              Verifikasi Wajah
            </Label>
            <p className="text-xs text-muted-foreground">
              Wajibkan verifikasi wajah saat melakukan presensi.
            </p>
          </div>
          <Switch
            id="toggle-face"
            checked={rule?.requireFaceVerification ?? false}
            onCheckedChange={() => handleToggle("requireFaceVerification")}
            disabled={toggling === "face"}
          />
        </div>

        {/* Require Within Area Toggle */}
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <Label
              htmlFor="toggle-area"
              className="text-sm font-medium cursor-pointer"
            >
              Verifikasi Lokasi
            </Label>
            <p className="text-xs text-muted-foreground">
              Wajibkan pengguna berada dalam area presensi yang ditentukan.
            </p>
          </div>
          <Switch
            id="toggle-area"
            checked={rule?.requireWithinArea ?? false}
            onCheckedChange={() => handleToggle("requireWithinArea")}
            disabled={toggling === "area"}
          />
        </div>
      </CardContent>
    </Card>
  );
}
