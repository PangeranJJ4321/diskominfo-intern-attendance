import { notFound } from "next/navigation";
import Image from "next/image";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { ArrowLeft, User, ShieldCheck, ShieldAlert, Building, MapPin, CalendarDays, CheckCircle2, Clock, XCircle, FileWarning } from "lucide-react";
import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { getInitials } from "@/lib/string-utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import FaceResetButton from "./face-reset-button";
import InternDeleteButton from "./intern-delete-button";

type PageProps = {
  params: Promise<{ agencyId: string; userId: string }>;
};

export default async function AdminUserDetailPage({ params }: PageProps) {
  const { agencyId, userId } = await params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      faceDescriptors: true,
      interns: {
        where: { agencyId },
        include: {
          institution: true,
          shiftAssignments: {
            include: { shift: true },
            orderBy: { startDate: "desc" }
          },
          attendances: true
        }
      }
    }
  });

  if (!user) {
    notFound();
  }

  // Calculate statistics
  let totalHadir = 0;
  let totalTerlambat = 0;
  let totalAlpa = 0;
  let totalSakit = 0;
  let totalIzin = 0;
  let totalPresensi = 0;

  user.interns.forEach(intern => {
    intern.attendances.forEach(att => {
      totalPresensi++;
      switch (att.status) {
        case "PRESENT": totalHadir++; break;
        case "LATE": totalTerlambat++; totalHadir++; break; // Terlambat is usually counted as present too
        case "ABSENT": totalAlpa++; break;
        case "SICK": totalSakit++; break;
        case "EXCUSED": totalIzin++; break;
      }
    });
  });

  const activeIntern = user.interns.find(i => !i.finishedAt || i.finishedAt > new Date());
  const hasFaceData = user.faceDescriptors.length > 0;
  const isCurrentlyActive = !!activeIntern;

  return (
    <div className="flex flex-col gap-6 w-full pb-10">
      {/* Header & Navigation */}
      <div className="flex items-center gap-4 border-b border-border/40 pb-4">
        <Link href={`/admin/${agencyId}/users`} className="p-2 rounded-full hover:bg-muted/50 transition-colors">
          <ArrowLeft className="size-5 text-muted-foreground" />
        </Link>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Profil Mahasiswa Intern</h1>
          <p className="text-xs text-muted-foreground">Detail informasi, riwayat shift, dan manajemen biometrik</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Profile Card */}
        <div className="md:col-span-1 space-y-6">
          <Card className="overflow-hidden border-border/40 shadow-sm bg-background/50">
            <div className="h-24 bg-gradient-to-br from-primary/20 via-primary/5 to-background" />
            <div className="px-6 pb-6 -mt-12 flex flex-col items-center text-center">
              <Avatar className="size-24 border-4 border-background shadow-sm mb-4">
                <AvatarImage src={user.image || undefined} alt={user.name} />
                <AvatarFallback className="text-2xl font-bold bg-muted text-muted-foreground">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-bold text-foreground">{user.name}</h2>
              <p className="text-sm text-muted-foreground mb-4">{user.email}</p>
              
              <div className="w-full flex items-center justify-center gap-2 mb-6">
                <Badge variant={isCurrentlyActive ? "default" : "secondary"} className="rounded-full font-semibold">
                  {isCurrentlyActive ? "Status: Aktif" : "Status: Nonaktif"}
                </Badge>
                {activeIntern?.institution && (
                  <Badge variant="outline" className="rounded-full text-muted-foreground bg-background">
                    <Building className="size-3 mr-1" />
                    {activeIntern.institution.name}
                  </Badge>
                )}
              </div>

              <div className="w-full space-y-3 text-sm">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30">
                  <div className="flex items-center gap-2 text-muted-foreground font-medium">
                    <User className="size-4" />
                    ID Mahasiswa Intern
                  </div>
                  <span className="font-mono text-xs text-foreground/80">{user.id.substring(0, 8)}...</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30">
                  <div className="flex items-center gap-2 text-muted-foreground font-medium">
                    <CalendarDays className="size-4" />
                    Bergabung
                  </div>
                  <span className="font-semibold text-foreground/80">
                    {format(new Date(user.createdAt), "dd MMM yyyy", { locale: localeId })}
                  </span>
                </div>
              </div>

              {user.interns.length > 0 && (
                <div className="w-full mt-6 pt-6 border-t border-border/40">
                  <InternDeleteButton internId={user.interns[0].id} agencyId={agencyId} />
                </div>
              )}
            </div>
          </Card>

          {/* Biometric Status Card */}
          <Card className="border-border/40 shadow-sm bg-background/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                Biometrik Wajah
              </CardTitle>
              <CardDescription className="text-xs">
                Status pendaftaran pengenalan wajah untuk mahasiswa intern ini.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`flex items-start gap-3 p-3 rounded-lg border ${hasFaceData ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
                {hasFaceData ? (
                  <ShieldCheck className="size-5 text-emerald-500 mt-0.5 shrink-0" />
                ) : (
                  <ShieldAlert className="size-5 text-amber-500 mt-0.5 shrink-0" />
                )}
                <div className="space-y-1">
                  <p className={`text-sm font-bold ${hasFaceData ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {hasFaceData ? "Wajah Terdaftar" : "Wajah Belum Terdaftar"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {hasFaceData 
                      ? "Mahasiswa intern ini bisa melakukan presensi wajah menggunakan kamera." 
                      : "Mahasiswa intern ini perlu mendaftarkan wajahnya melalui halaman profilnya agar bisa absen."}
                  </p>
                </div>
              </div>
              
              {hasFaceData && (
                <div className="mt-4 pt-4 border-t border-border/40">
                  <FaceResetButton userId={user.id} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Details & Stats */}
        <div className="md:col-span-2 space-y-6">
          {/* Statistics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border/40 shadow-sm bg-background/50">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-1">
                <div className="size-10 rounded-full bg-emerald-500/10 flex items-center justify-center mb-1">
                  <CheckCircle2 className="size-5 text-emerald-500" />
                </div>
                <p className="text-2xl font-bold text-foreground">{totalHadir}</p>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Total Hadir</p>
              </CardContent>
            </Card>
            <Card className="border-border/40 shadow-sm bg-background/50">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-1">
                <div className="size-10 rounded-full bg-amber-500/10 flex items-center justify-center mb-1">
                  <Clock className="size-5 text-amber-500" />
                </div>
                <p className="text-2xl font-bold text-foreground">{totalTerlambat}</p>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Terlambat</p>
              </CardContent>
            </Card>
            <Card className="border-border/40 shadow-sm bg-background/50">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-1">
                <div className="size-10 rounded-full bg-sky-500/10 flex items-center justify-center mb-1">
                  <FileWarning className="size-5 text-sky-500" />
                </div>
                <p className="text-2xl font-bold text-foreground">{totalIzin + totalSakit}</p>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Izin / Sakit</p>
              </CardContent>
            </Card>
            <Card className="border-border/40 shadow-sm bg-background/50">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-1">
                <div className="size-10 rounded-full bg-destructive/10 flex items-center justify-center mb-1">
                  <XCircle className="size-5 text-destructive" />
                </div>
                <p className="text-2xl font-bold text-foreground">{totalAlpa}</p>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Alpa</p>
              </CardContent>
            </Card>
          </div>

          {/* Shift History */}
          <Card className="border-border/40 shadow-sm bg-background/50">
            <CardHeader className="pb-4 border-b border-border/40">
              <CardTitle className="text-base font-bold">Riwayat Penugasan Shift</CardTitle>
              <CardDescription className="text-xs">
                Semua shift yang pernah ditugaskan kepada mahasiswa intern ini di instansi Anda.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {user.interns.flatMap(i => i.shiftAssignments).length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  Belum ada riwayat penugasan shift untuk mahasiswa intern ini.
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {user.interns.flatMap(i => i.shiftAssignments)
                    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
                    .map(assign => {
                      const isActive = !assign.endDate || new Date(assign.endDate) > new Date();
                      
                      return (
                        <div key={assign.id} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
                          <div className="space-y-1">
                            <p className="font-bold text-sm text-foreground">{assign.shift.name}</p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <CalendarDays className="size-3" />
                                {format(new Date(assign.startDate), "dd MMM yyyy", { locale: localeId })}
                                {" — "}
                                {assign.endDate ? format(new Date(assign.endDate), "dd MMM yyyy", { locale: localeId }) : "Seterusnya"}
                              </span>
                            </div>
                          </div>
                          <div>
                            {isActive ? (
                              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20 text-[10px]">
                                Aktif
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground text-[10px]">
                                Berakhir
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
