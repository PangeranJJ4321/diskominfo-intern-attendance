import SchedulesCard from "../components/schedules-card";

export default async function SchedulesAdminPage({
  params,
}: {
  params: Promise<{ agencyId: string }>;
}) {
  const { agencyId } = await params;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-3xl font-bold tracking-tight">
          Jadwal & Shift
        </h1>
        <p className="text-muted-foreground text-sm">
          Kelola shift kerja (jam masuk & keluar) dan tentukan hari libur operasional instansi.
        </p>
      </div>

      <SchedulesCard agencyId={agencyId} />
    </div>
  );
}
