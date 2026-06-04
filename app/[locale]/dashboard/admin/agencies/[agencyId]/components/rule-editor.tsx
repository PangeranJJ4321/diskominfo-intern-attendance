"use client";
"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { EditableNumberInput } from "@/components/custom/editable-number-input";
import {
  defaultAgencyRuleData,
  agencyRuleSchema,
} from "@/lib/schemas/agency-rule";
import { RequireFaceVerificationSwitch } from "./require-face-verification-switch";
import { RequireWithinAreaSwitch } from "./require-within-area-switch";

type AgencyRuleState = {
  id: string | null;
  requireFaceVerification: boolean;
  requireWithinArea: boolean;
  lateToleranceMinutes: number;
};

type RuleEditorProps = {
  agencyId: string;
  initialRule: AgencyRuleState | null;
};

const SAVE_DEBOUNCE_MS = 600;

const toInitialState = (): AgencyRuleState => ({
  id: null,
  requireFaceVerification: defaultAgencyRuleData.requireFaceVerification,
  requireWithinArea: defaultAgencyRuleData.requireWithinArea,
  lateToleranceMinutes: defaultAgencyRuleData.lateToleranceMinutes,
});

const normalizeRuleItem = (raw: unknown): AgencyRuleState | null => {
  const parsed = agencyRuleSchema.safeParse(raw);

  if (!parsed.success) {
    return null;
  }

  return {
    id: parsed.data.id,
    requireFaceVerification: parsed.data.requireFaceVerification,
    requireWithinArea: parsed.data.requireWithinArea,
    lateToleranceMinutes: parsed.data.lateToleranceMinutes,
  };
};

const toState = (initialRule: AgencyRuleState | null): AgencyRuleState =>
  initialRule ?? toInitialState();

export default function RuleEditor({ agencyId, initialRule }: RuleEditorProps) {
  const t = useTranslations();
  const [ruleState, setRuleState] = useState<AgencyRuleState>(() =>
    toState(initialRule),
  );
  const [isSavingTolerance, setIsSavingTolerance] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveSequenceRef = useRef(0);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const refreshRule = async (): Promise<AgencyRuleState | null> => {
    const response = await fetch(`/api/agency-rules/${agencyId}`);

    if (!response.ok) {
      return null;
    }

    const json: unknown = await response.json().catch(() => null);

    return normalizeRuleItem(json);
  };

  const upsertRule = async (
    nextState: AgencyRuleState,
  ): Promise<AgencyRuleState> => {
    if (!nextState.id) {
      const response = await fetch(`/api/agency-rules/${agencyId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requireFaceVerification: nextState.requireFaceVerification,
          requireWithinArea: nextState.requireWithinArea,
          lateToleranceMinutes: nextState.lateToleranceMinutes,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error ?? "Gagal membuat aturan dinas",
        );
      }

      const created = normalizeRuleItem(await response.json());

      if (!created) {
        throw new Error("Respons aturan dinas tidak valid");
      }

      return created;
    }

    const response = await fetch(`/api/agency-rules/${agencyId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requireFaceVerification: nextState.requireFaceVerification,
        requireWithinArea: nextState.requireWithinArea,
        lateToleranceMinutes: nextState.lateToleranceMinutes,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(
        (data as { error?: string }).error ?? "Gagal memperbarui aturan dinas",
      );
    }

    const updated = normalizeRuleItem(await response.json());

    if (!updated) {
      throw new Error("Respons aturan dinas tidak valid");
    }

    return updated;
  };

  const scheduleToleranceSave = (nextMinutes: number) => {
    const previousState = ruleState;
    const optimisticState = {
      ...previousState,
      lateToleranceMinutes: nextMinutes,
    };

    setRuleState(optimisticState);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    const saveToken = saveSequenceRef.current + 1;
    saveSequenceRef.current = saveToken;

    debounceRef.current = setTimeout(() => {
      setIsSavingTolerance(true);

      void (async () => {
        try {
          const persisted = await upsertRule(optimisticState);

          if (saveSequenceRef.current === saveToken) {
            setRuleState(persisted);
          }
        } catch (error) {
          console.error("RuleEditor tolerance save error:", error);

          if (saveSequenceRef.current === saveToken) {
            setRuleState(previousState);
            toast.error(
              error instanceof Error
                ? error.message
                : t("Gagal menyimpan aturan dinas"),
            );
          }
        } finally {
          if (saveSequenceRef.current === saveToken) {
            setIsSavingTolerance(false);
          }
        }
      })();
    }, SAVE_DEBOUNCE_MS);
  };

  if (!agencyId) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">
          Agency ID belum tersedia.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Aturan Kehadiran Dinas</h2>
          <p className="text-sm text-muted-foreground">
            Perubahan disimpan otomatis tanpa tombol submit.
          </p>
        </div>

        <RequireFaceVerificationSwitch
          agencyId={agencyId}
          initialValue={ruleState.requireFaceVerification}
          onSuccess={(value) => {
            setRuleState((previous) => ({
              ...previous,
              requireFaceVerification: value,
            }));
            void refreshRule().then((rule) => {
              if (rule) {
                setRuleState(rule);
              }
            });
          }}
        />

        <RequireWithinAreaSwitch
          agencyId={agencyId}
          initialValue={ruleState.requireWithinArea}
          onSuccess={(value) => {
            setRuleState((previous) => ({
              ...previous,
              requireWithinArea: value,
            }));
            void refreshRule().then((rule) => {
              if (rule) {
                setRuleState(rule);
              }
            });
          }}
        />

        <div className="rounded-xl border bg-muted/30 p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <Label
                htmlFor="lateToleranceMinutes"
                className="text-base font-semibold"
              >
                Toleransi Keterlambatan (Menit)
              </Label>
              <p className="text-sm text-muted-foreground">
                Batas menit keterlambatan sebelum absen dianggap tidak hadir.
              </p>
            </div>
            <div className="w-28">
              <EditableNumberInput
                id="lateToleranceMinutes"
                value={ruleState.lateToleranceMinutes}
                min={0}
                disabled={isSavingTolerance}
                onValueChange={scheduleToleranceSave}
                data-testid="input-late-tolerance-minutes"
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
