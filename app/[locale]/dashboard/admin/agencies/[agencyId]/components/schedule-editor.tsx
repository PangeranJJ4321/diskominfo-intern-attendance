//components/schedule-editor.tsx
"use client";
import { useParams } from "next/navigation";

import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import ScheduleEditorHolidaysTab from "./schedule-editor-holidays-tab";
import ScheduleEditorWeeklyTab from "./schedule-editor-weekly-tab";

type ScheduleParams = {
  agencyId?: string | string[];
};

type DayLabel = {
  value: number;
  short: string;
  long: string;
  weekend: boolean;
};

const DAY_LABELS: DayLabel[] = [
  { value: 0, short: "Sun", long: "Sunday", weekend: true },
  { value: 1, short: "Mon", long: "Monday", weekend: false },
  { value: 2, short: "Tue", long: "Tuesday", weekend: false },
  { value: 3, short: "Wed", long: "Wednesday", weekend: false },
  { value: 4, short: "Thu", long: "Thursday", weekend: false },
  { value: 5, short: "Fri", long: "Friday", weekend: false },
  { value: 6, short: "Sat", long: "Saturday", weekend: true },
];

export default function ScheduleEditor() {
  const params = useParams<ScheduleParams>();
  const agencyId = Array.isArray(params.agencyId)
    ? params.agencyId[0]
    : params.agencyId;

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
          <h2 className="text-lg font-semibold">Jadwal Operasional</h2>
          <p className="text-sm text-muted-foreground">
            Kelola hari kerja standar dan pengecualian hari libur. Perubahan
            disimpan otomatis.
          </p>
        </div>

        <Tabs defaultValue="holidays" className="w-full space-y-4">
          <TabsList className="grid w-full grid-cols-2 sm:w-auto">
            <TabsTrigger value="holidays">Hari Libur</TabsTrigger>
            <TabsTrigger value="weekly">Jadwal Mingguan</TabsTrigger>
          </TabsList>

          <ScheduleEditorHolidaysTab
            agencyId={agencyId}
            dayLabels={DAY_LABELS}
          />

          <ScheduleEditorWeeklyTab agencyId={agencyId} />
        </Tabs>
      </div>
    </Card>
  );
}
