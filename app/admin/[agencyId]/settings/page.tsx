"use client";

import { use } from "react";
import AgencyDetailsCard from "../components/agency-details-card";
import AgencyRulesCard from "../components/agency-rules-card";
import ShareAccessCard from "../components/share-access-card";

export default function SettingsAdminPage({
  params,
}: {
  params: Promise<{ agencyId: string }>;
}) {
  const { agencyId } = use(params);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-3xl font-bold tracking-tight">
          Pengaturan Instansi
        </h1>
        <p className="text-muted-foreground text-sm">
          Atur detail instansi, aturan presensi, dan bagikan akses admin ke pengguna lain.
        </p>
      </div>

      <AgencyDetailsCard agencyId={agencyId} />
      <AgencyRulesCard agencyId={agencyId} />
      <ShareAccessCard agencyId={agencyId} />
    </div>
  );
}
