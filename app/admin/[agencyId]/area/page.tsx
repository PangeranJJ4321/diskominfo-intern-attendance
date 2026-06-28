"use client";

import AreaMapEditorCard from "../components/area-map-editor-card";

export default function AreaAdminPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-3xl font-bold tracking-tight">
          Area Geografis
        </h1>
        <p className="text-muted-foreground text-sm">
          Atur zona presensi geografis menggunakan polygon untuk membatasi lokasi check-in pengguna.
        </p>
      </div>

      <AreaMapEditorCard />
    </div>
  );
}
