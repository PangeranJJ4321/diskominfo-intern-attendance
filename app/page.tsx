"use client";

import { useState } from "react";
import { useSession } from "@/lib/auth-client";
import { Logo } from "@/components/custom/logo";
import { NavbarAvatar } from "@/components/custom/navbar-avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import Link from "next/link";
import {
  MapPin,
  Building2,
  ShieldCheck,
  Camera,
  Clock,
  ArrowRight,
  CheckCircle2,
  FileText,
  Globe,
  Menu,
} from "lucide-react";

/**
 * Renders the home landing page of the application, detailing the app functionality,
 * biometrics, and shift structures for DISKOMINFO Intern.
 * Fully styled using Shadcn UI components and global theme variables.
 *
 * @returns {React.JSX.Element} The rendered Home Page.
 */
export default function Home() {
  const { data: session, isPending } = useSession();
  const user = session?.user ?? null;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /**
   * Scrolls smoothly to a specific page section.
   *
   * @param {string} id The element ID to scroll to.
   */
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setMobileMenuOpen(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-linear-to-b from-background via-muted/30 to-background font-sans text-foreground">
      {/* ── Header / Navigation ── */}
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 sm:px-10 lg:px-16">
          <div className="flex items-center gap-3">
            <Logo textClassName="text-foreground font-bold" />
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1.5">
            <Button
              variant="ghost"
              onClick={() => scrollToSection("features")}
              className="text-muted-foreground hover:text-foreground font-medium"
            >
              Fitur Utama
            </Button>
            <Button
              variant="ghost"
              onClick={() => scrollToSection("how-it-works")}
              className="text-muted-foreground hover:text-foreground font-medium"
            >
              Cara Kerja
            </Button>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <NavbarAvatar />
          </div>

          {/* Mobile menu trigger */}
          <div className="flex items-center gap-2 md:hidden">
            <NavbarAvatar />
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg text-foreground hover:bg-muted"
              aria-label="Toggle menu"
            >
              <Menu className="size-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Dropdown Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-border bg-background/95 backdrop-blur-md px-6 py-4 flex flex-col space-y-2">
            <Button
              variant="ghost"
              onClick={() => scrollToSection("features")}
              className="justify-start text-muted-foreground hover:text-foreground"
            >
              Fitur Utama
            </Button>
            <Button
              variant="ghost"
              onClick={() => scrollToSection("how-it-works")}
              className="justify-start text-muted-foreground hover:text-foreground"
            >
              Cara Kerja
            </Button>
          </div>
        )}
      </header>

      {/* ── Hero Section ── */}
      <section className="relative w-full min-h-dvh flex items-center overflow-hidden">
        {/* Dynamic theme background base using primary and secondary colors */}
        <div className="absolute inset-0 bg-linear-to-br from-secondary via-secondary/95 to-primary/50" />

        <div className="relative z-10 max-w-7xl w-full mx-auto px-6 sm:px-10 lg:px-16 py-32">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Column: Heading & CTAs */}
            <div className="max-w-xl space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/20 px-4 py-1.5 text-xs text-primary/90">
                <CheckCircle2 className="size-3.5 text-primary" />
                Sistem Presensi Digital DISKOMINFO
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-primary leading-[1.1] tracking-tight">
                Kelola Presensi Karyawan Secara Mandiri
              </h1>
              <p className="text-base sm:text-lg text-primary/80 leading-relaxed max-w-md">
                Platform presensi online modern untuk seluruh karyawan di
                lingkungan kerja DISKOMINFO Intern. Pantau log aktivitas secara
                real-time, kelola jadwal shift, dan hasilkan laporan otomatis.
              </p>

              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                {isPending ? (
                  <div className="h-12 w-40 bg-primary/10 rounded-xl animate-pulse" />
                ) : user ? (
                  <Button
                    asChild
                    size="lg"
                    className="h-12 px-7 text-base font-semibold rounded-xl transition-all shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                  >
                    <Link href="/dashboard">
                      Masuk ke Portal <ArrowRight className="ml-2 size-4" />
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button
                      asChild
                      size="lg"
                      className="h-12 px-7 text-base font-semibold rounded-xl transition-all shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                    >
                      <Link href="/auth/sign-in">
                        Masuk ke Portal <ArrowRight className="ml-2 size-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => scrollToSection("features")}
                      className="h-12 px-7 text-base font-medium rounded-xl border-primary/20 text-primary hover:bg-primary/10 bg-transparent hover:text-primary hover:border-primary/30"
                    >
                      Pelajari Fitur
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Right Column: Unit Profile Card using Shadcn Card */}
            <div className="hidden lg:flex justify-end">
              <div className="relative w-85">
                {/* Main Card */}
                <Card className="border border-primary/30 bg-primary/20 backdrop-blur-md shadow-2xl text-primary">
                  <CardHeader className="p-8 pb-0">
                    <div className="size-16 rounded-2xl overflow-hidden border border-primary/10 mb-6 bg-primary/5 flex items-center justify-center">
                      <Building2 className="size-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl font-bold text-primary">
                      DISKOMINFO Intern
                    </CardTitle>
                    <CardDescription className="text-sm text-primary/75 leading-relaxed mt-2">
                      Sistem validasi presensi multi-sensor terpusat untuk
                      Satuan Pelayanan Pemenuhan Gizi Mamuju, Provinsi Sulawesi
                      Barat.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-8 pt-6">
                    {/* Key feature checkboxes */}
                    <ul className="space-y-3">
                      <li className="flex items-center gap-2.5 text-sm text-secondary-foreground/90 font-medium">
                        <CheckCircle2 className="size-4.5 text-secondary-foreground shrink-0" />
                        Validasi Jadwal Presensi
                      </li>
                      <li className="flex items-center gap-2.5 text-sm text-secondary-foreground/90 font-medium">
                        <CheckCircle2 className="size-4.5 text-secondary-foreground shrink-0" />
                        Validasi Area Kantor
                      </li>
                      <li className="flex items-center gap-2.5 text-sm text-secondary-foreground/90 font-medium">
                        <CheckCircle2 className="size-4.5 text-secondary-foreground shrink-0" />
                        Verifikasi Biometrik Wajah
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Fitur Utama Section ── */}
      <section
        id="features"
        className="w-full py-24 md:py-32 scroll-mt-20 border-b border-border"
      >
        <div className="max-w-7xl w-full mx-auto px-6 sm:px-10 lg:px-16">
          <div className="max-w-2xl mb-16 space-y-3">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider">
              Fitur Unggulan
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
              Semua yang Anda Butuhkan untuk Manajemen Presensi
            </h2>
            <p className="text-muted-foreground text-base leading-relaxed">
              Didesain untuk mempermudah administrasi, meminimalkan kecurangan
              presensi, dan meningkatkan akuntabilitas waktu kerja staf.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <Card className="border border-border/80 shadow-xs hover:border-primary/40 hover:bg-muted/10 transition-all duration-300">
              <CardContent className="pt-6 space-y-4">
                <div className="size-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Camera className="size-5" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-foreground">
                    Verifikasi Wajah
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Pengenalan biometrik wajah real-time menggunakan webcam atau
                    kamera ponsel untuk memvalidasi identitas staf yang
                    melakukan absen.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="border border-border/80 shadow-xs hover:border-primary/40 hover:bg-muted/10 transition-all duration-300">
              <CardContent className="pt-6 space-y-4">
                <div className="size-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <MapPin className="size-5" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-foreground">
                    Validasi Lokasi Karyawan
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Pencocokan koordinat GPS secara akurat untuk memastikan
                    pengiriman presensi dilakukan tepat di dalam radius wilayah
                    kerja unit.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="border border-border/80 shadow-xs hover:border-primary/40 hover:bg-muted/10 transition-all duration-300">
              <CardContent className="pt-6 space-y-4">
                <div className="size-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Clock className="size-5" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-foreground">
                    Fleksibilitas Shift
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Pengaturan jadwal shift kerja karyawan dengan jam masuk,
                    batas dispensasi keterlambatan, cut-off presensi, dan
                    deteksi hari libur.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card className="border border-border/80 shadow-xs hover:border-primary/40 hover:bg-muted/10 transition-all duration-300">
              <CardContent className="pt-6 space-y-4">
                <div className="size-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <FileText className="size-5" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-foreground">
                    Ekspor Laporan
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Hasilkan laporan rekap presensi bulanan atau rentang tanggal
                    tertentu ke format spreadsheet Excel secara cepat untuk
                    kebutuhan audit.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Feature 5 */}
            <Card className="border border-border/80 shadow-xs hover:border-primary/40 hover:bg-muted/10 transition-all duration-300">
              <CardContent className="pt-6 space-y-4">
                <div className="size-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <ShieldCheck className="size-5" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-foreground">
                    Proteksi Anti-Fraud
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Mendeteksi manipulasi presensi seperti penggunaan Mock GPS
                    (Fake GPS), manipulasi waktu sistem, emulator, VPN, maupun
                    akses ganda.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ── Cara Kerja Section ── */}
      <section
        id="how-it-works"
        className="w-full py-24 md:py-32 bg-muted/40 scroll-mt-20 border-b border-border"
      >
        <div className="max-w-7xl w-full mx-auto px-6 sm:px-10 lg:px-16">
          <div className="max-w-2xl mb-16 space-y-3">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider">
              Cara Kerja
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
              Tiga Langkah Mudah Presensi
            </h2>
            <p className="text-muted-foreground text-base leading-relaxed">
              Prosedur presensi harian karyawan yang cepat, mandiri, dan
              terenkripsi aman.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            {/* Step 1 */}
            <div className="relative space-y-4">
              <div className="hidden md:block absolute top-5 left-12 w-[calc(100%-48px)] border-t-2 border-dashed border-border z-0" />
              <div className="relative z-10 size-10 rounded-xl bg-linear-to-br from-primary to-secondary text-primary-foreground font-mono font-bold text-sm flex items-center justify-center shadow-md">
                01
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground">
                  Daftar &amp; Registrasi Wajah
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Lakukan pendaftaran akun karyawan, lalu daftarkan foto wajah
                  Anda di profil pengguna.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative space-y-4">
              <div className="hidden md:block absolute top-5 left-12 w-[calc(100%-48px)] border-t-2 border-dashed border-border z-0" />
              <div className="relative z-10 size-10 rounded-xl bg-linear-to-br from-primary to-secondary text-primary-foreground font-mono font-bold text-sm flex items-center justify-center shadow-md">
                02
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground">
                  Verifikasi Kamera &amp; GPS
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Buka dashboard, izinkan perizinan kamera browser dan koordinat
                  GPS dan tekan tombol simpan absen.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative space-y-4">
              <div className="relative z-10 size-10 rounded-xl bg-linear-to-br from-primary to-secondary text-primary-foreground font-mono font-bold text-sm flex items-center justify-center shadow-md">
                03
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground">
                  Lihat Riwayat
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Anda dapat melihat data presensi harian Anda.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="w-full border-t py-12 bg-card">
        <div className="max-w-7xl w-full mx-auto px-6 sm:px-10 lg:px-16 space-y-8">
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
            {/* Column 1: Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Logo textClassName="text-foreground font-bold" />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
                Sistem presensi mandiri karyawan terintegrasi berbasis koordinat
                wilayah kantor dan pengenalan wajah biometrik pada DISKOMINFO
                Intern.
              </p>
            </div>

            {/* Column 2: Navigation Links */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-foreground">
                Navigasi Portal
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link
                    href="/auth/sign-in"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Masuk Akun
                  </Link>
                </li>
                <li>
                  <Link
                    href="/auth/sign-up"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Daftar Akun
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Dashboard Karyawan
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Administrasi Admin
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Contact Details */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-foreground">Kontak Unit</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Building2 className="size-4 shrink-0 mt-0.5" />
                  <span>DISKOMINFO Intern</span>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin className="size-4 shrink-0 mt-0.5" />
                  <span>
                    Jl. Poros Mamuju Kalukku Km. 19, Tadui, Kec. Mamuju, Kab.
                    Mamuju, Sulawesi Barat
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Globe className="size-4 shrink-0 mt-0.5" />
                  <span>Provinsi Sulawesi Barat, Indonesia</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <span>
              &copy; {new Date().getFullYear()} DISKOMINFO Intern. Hak cipta
              dilindungi.
            </span>
            <div className="flex items-center gap-2 font-mono text-[10px]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>ZONA WITA (UTC+8)</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
