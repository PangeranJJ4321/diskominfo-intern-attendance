"use client";

import { use } from "react";
import { Navbar } from "@/components/custom/navbar";
import AreaMapEditorCard from "./components/area-map-editor-card";
import SchedulesCard from "./components/schedules-card";
import UserAttendancesCard from "./components/user-attendances-card";
import ShareAccessCard from "./components/share-access-card";
import AgencyRulesCard from "./components/agency-rules-card";
/**
 * Multi-tenant admin page scoped to a specific agency.
 * Displays agency-specific admin controls including rules, area map, schedules,
 * user attendances, and access sharing.
 *
 * @param {{ params: Promise<{ agencyId: string }> }} props - The route parameters containing the agency ID.
 * @returns {React.JSX.Element} The rendered admin page.
 */
export default function AgencyAdminPage({
  params,
}: {
  params: Promise<{ agencyId: string }>;
}) {
  const { agencyId } = use(params);

  return (
    <>
      <Navbar />
      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-3xl font-bold tracking-tight">
            Pengaturan Admin
          </h1>
          <p className="text-muted-foreground text-sm">
            Atur aturan presensi, area geografis presensi, jadwal operasional,
            shift, presensi pengguna, hari libur, dan akses administrator untuk
            instansi ini.
          </p>
        </div>

        {/* Agency Rules Card — toggles for face verification and location verification */}
        <AgencyRulesCard agencyId={agencyId} />

        <AreaMapEditorCard />
        <SchedulesCard />
        <UserAttendancesCard />
        <ShareAccessCard agencyId={agencyId} />
      </main>
    </>
  );
}
