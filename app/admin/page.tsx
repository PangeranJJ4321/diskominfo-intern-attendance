import { Navbar } from "@/components/custom/navbar";
import AreaMapEditorCard from "./components/area-map-editor-card";
import SchedulesCard from "./components/schedules-card";
import UserAttendancesCard from "./components/user-attendances-card";
import ShareAccessCard from "./components/share-access-card";

export default function AdminPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-3xl font-bold tracking-tight">Pengaturan Admin</h1>
          <p className="text-muted-foreground text-sm">
            Atur area geografis presensi, jadwal operasional, shift, presensi pengguna, hari libur, dan akses administrator.
          </p>
        </div>

        <AreaMapEditorCard />
        <SchedulesCard />
        <UserAttendancesCard />
        <ShareAccessCard />
      </main>
    </>
  );
}
