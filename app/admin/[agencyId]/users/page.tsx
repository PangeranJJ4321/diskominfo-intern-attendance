"use client";

import UserAttendancesCard from "../components/user-attendances-card";

export default function UsersAdminPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-3xl font-bold tracking-tight">
          Presensi Pengguna
        </h1>
        <p className="text-muted-foreground text-sm">
          Kelola riwayat presensi, periksa bukti foto, dan ubah status presensi pengguna.
        </p>
      </div>

      <UserAttendancesCard />
    </div>
  );
}
