"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { getAgencyAccesses } from "@/lib/services/agency-accesses";
import { Logo } from "@/components/custom/logo";
import { NavbarAvatar } from "@/components/custom/navbar-avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollToTopButton } from "@/components/custom/scroll-to-top-button";
import { ScrollToSectionButton } from "@/components/custom/scroll-to-section-button";
import Link from "next/link";
import {
  ScanFace,
  MapPin,
  CalendarClock,
  FileSpreadsheet,
  ShieldCheck,
  Activity,
  ArrowRight,
  Mail,
  MapPinned,
  CheckCircle2,
  Globe,
  Menu,
} from "lucide-react";

/**
 * Landing page — Diskominfo Intern Attendance System.
 *
 * Heuristic foundations applied:
 * - Nielsen #2 (Match real world): Government/institutional language, Makassar context
 * - Nielsen #4 (Consistency): Reuses sign-in page gradient, same component library
 * - Nielsen #8 (Aesthetic & minimalist): Every element serves a purpose
 * - Fitts's Law: Primary CTAs are large & high-contrast (white on gradient)
 * - Hick's Law: Max 2 CTA choices per section to reduce decision paralysis
 * - Gestalt Proximity: Related content grouped with clear spacing
 * - Gestalt Similarity: Identical card treatment across features
 * - Visual Hierarchy: Size & color contrast guide the eye Hero→Features→Steps→CTA
 * - F-Pattern: Left-aligned section headers, scannable feature grid
 *
 * @returns {React.JSX.Element} The rendered landing page.
 */
export default function HomePage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const user = session?.user ?? null;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /**
   * Redirects authenticated users to /admin or /dashboard
   * based on whether they have AgencyAccess records.
   */
  useEffect(() => {
    if (isPending) return;
    if (!session?.user) return;

    async function redirectBasedOnAccess() {
      try {
        const accesses = await getAgencyAccesses();
        if (accesses.length > 0) {
          router.replace("/admin");
        } else {
          router.replace("/dashboard");
        }
      } catch {
        // If the access check fails, default to dashboard.
        router.replace("/dashboard");
      }
    }

    void redirectBasedOnAccess();
  }, [isPending, session, router]);

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

  const features = [
    {
      icon: ScanFace,
      title: "Verifikasi Wajah",
      description:
        "Teknologi pengenalan wajah untuk memastikan keabsahan absensi secara real-time.",
    },
    {
      icon: MapPin,
      title: "Validasi Lokasi",
      description:
        "Pemeriksaan geofencing otomatis untuk memastikan absensi dilakukan di area kantor.",
    },
    {
      icon: CalendarClock,
      title: "Jadwal Fleksibel",
      description:
        "Kelola jadwal absensi per dinas dengan pengaturan hari dan jam yang mudah dikustomisasi.",
    },
    {
      icon: FileSpreadsheet,
      title: "Laporan & Ekspor",
      description:
        "Hasilkan laporan kehadiran lengkap dan ekspor data ke format Excel dengan sekali klik.",
    },
    {
      icon: ShieldCheck,
      title: "Multi Peran",
      description:
        "Sistem peran Superadmin, Admin Dinas, dan Peserta Magang dengan akses yang terkontrol.",
    },
    {
      icon: Activity,
      title: "Monitoring Real-time",
      description:
        "Dashboard pemantauan kehadiran secara langsung dengan status hadir, terlambat, dan absen.",
    },
  ];

  const steps = [
    {
      number: "01",
      title: "Daftar & Login",
      description:
        "Buat akun atau masuk ke portal dengan kredensial yang sudah terdaftar.",
    },
    {
      number: "02",
      title: "Catat Kehadiran",
      description:
        "Lakukan absensi dengan verifikasi wajah dan lokasi sesuai jadwal yang ditentukan.",
    },
    {
      number: "03",
      title: "Pantau & Laporan",
      description:
        "Admin dapat memantau kehadiran real-time dan mengunduh laporan kapan saja.",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background font-sans">
      {/* ── Header / Navigation ── */}
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-clear backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 sm:px-10 lg:px-16">
          <div className="flex items-center gap-3">
            <Logo textClassName="text-background font-bold" />
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1.5">
            <Button
              variant="ghost"
              onClick={() => scrollToSection("features")}
              className="text-background hover:text-foreground font-medium"
            >
              Fitur
            </Button>
            <Button
              variant="ghost"
              onClick={() => scrollToSection("how-it-works")}
              className="text-background hover:text-foreground font-medium"
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
              className="justify-start text-foreground hover:text-foreground/90"
            >
              Fitur
            </Button>
            <Button
              variant="ghost"
              onClick={() => scrollToSection("how-it-works")}
              className="justify-start text-foreground hover:text-foreground/90"
            >
              Cara Kerja
            </Button>
          </div>
        )}
      </header>

      {/* ════════════════════════════════════════════════════════════════
          HERO — Full-viewport gradient matching sign-in left panel.
          Heuristic: Nielsen #4 Consistency, Fitts's Law (large CTA),
          Hick's Law (only 2 actions).
          ════════════════════════════════════════════════════════════════ */}
      <section className="w-full relative min-h-dvh flex items-center overflow-hidden">
        {/* Background — consistent with auth pages */}
        <div className="absolute inset-0 bg-linear-to-br from-primary via-red-900 to-secondary" />
        {/* Subtle texture — NOT a blob, just a soft radial to add depth */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.08)_0%,transparent_60%)]" />

        <div className="relative z-10 max-w-7xl w-full mx-auto px-8 sm:px-12 md:px-16 lg:px-24 xl:px-32 py-32">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left — Text content (F-pattern: users scan left first) */}
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm text-white/90 mb-8">
                <CheckCircle2 className="size-3.5" />
                Sistem Absensi Digital Terintegrasi
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1] tracking-tight mb-6">
                Kelola Kehadiran Magang Secara Digital
              </h1>

              <p className="text-lg text-white/70 leading-relaxed mb-10 max-w-md">
                Platform absensi modern untuk Diskominfo Kota Makassar. Pantau
                kehadiran, kelola jadwal, dan hasilkan laporan — semua dalam
                satu sistem yang terintegrasi.
              </p>

              {/* CTAs — Fitts: large targets, high contrast primary action */}
              <div className="flex flex-wrap items-center gap-3">
                {isPending ? (
                  <div className="h-12 w-40 bg-white/10 rounded-xl animate-pulse" />
                ) : user ? (
                  <Link href="/dashboard">
                    <Button
                      size="lg"
                      className="h-12 px-7 text-base font-semibold bg-white text-primary hover:bg-white/90 rounded-xl transition-all"
                    >
                      Masuk ke Portal
                      <ArrowRight className="ml-2 size-4" />
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/auth/sign-in">
                      <Button
                        size="lg"
                        className="h-12 px-7 text-base font-semibold bg-white text-primary hover:bg-white/90 rounded-xl transition-all"
                      >
                        Masuk ke Portal
                        <ArrowRight className="ml-2 size-4" />
                      </Button>
                    </Link>
                    <ScrollToSectionButton
                      targetId="features"
                      className="h-12 px-7 text-base font-medium text-white/80 border border-white/20 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                      id="hero-secondary-cta"
                    >
                      Pelajari Fitur
                    </ScrollToSectionButton>
                  </>
                )}
              </div>
            </div>

            {/* Right — Brand identity card (provides visual anchor) */}
            <div className="hidden lg:flex justify-end">
              <div className="relative w-80">
                {/* Floating card — shows the product identity */}
                <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-8">
                  <h3 className="text-xl font-bold text-white mb-2">
                    Diskominfo Makassar
                  </h3>
                  <p className="text-sm text-white/60 leading-relaxed mb-6">
                    Sistem absensi digital terintegrasi untuk peserta magang
                    Pemerintah Kota Makassar.
                  </p>
                  {/* Mini feature list for quick scanning */}
                  <ul className="space-y-3">
                    {[
                      "Verifikasi Wajah",
                      "Validasi Lokasi",
                      "Monitoring Real-time",
                    ].map((item, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-2.5 text-sm text-white/80"
                      >
                        <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Decorative accent — subtle, purposeful */}
                <div className="absolute -bottom-4 -right-4 size-32 rounded-2xl bg-secondary/30 -z-10" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          FEATURES — Card grid.
          Heuristic: Gestalt Similarity (uniform cards), Proximity
          (icon+title+desc grouped), Recognition > Recall (icons).
          ════════════════════════════════════════════════════════════════ */}
      <section id="features" className="w-full py-24 md:py-32 scroll-mt-20">
        <div className="max-w-7xl w-full mx-auto px-8 sm:px-12 md:px-16 lg:px-24 xl:px-32">
          {/* Section header — left-aligned for F-pattern scanning */}
          <div className="max-w-xl mb-14">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">
              Fitur Unggulan
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-4">
              Semua yang Anda Butuhkan untuk Manajemen Absensi
            </h2>
            <p className="text-muted-foreground text-base leading-relaxed">
              Didesain untuk mempermudah administrasi dan meningkatkan
              akuntabilitas kehadiran peserta magang.
            </p>
          </div>

          {/* Grid — Gestalt Similarity: every card is identical in structure */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, i) => (
              <Card
                key={i}
                className="group border-0 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <CardContent className="pt-2">
                  {/* Icon — Recognition rather than Recall */}
                  <div className="size-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                    <feature.icon className="size-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-1.5">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          HOW IT WORKS — Sequential steps.
          Heuristic: Progressive Disclosure (step by step),
          Gestalt Continuity (visual connectors between steps).
          ════════════════════════════════════════════════════════════════ */}
      <section
        id="how-it-works"
        className="w-full py-24 md:py-32 bg-muted/40 scroll-mt-20"
      >
        <div className="max-w-7xl w-full mx-auto px-8 sm:px-12 md:px-16 lg:px-24 xl:px-32">
          <div className="max-w-xl mb-14">
            <p className="text-sm font-semibold text-secondary uppercase tracking-wider mb-3">
              Cara Kerja
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-4">
              Tiga Langkah Mudah
            </h2>
            <p className="text-muted-foreground text-base leading-relaxed">
              Proses absensi yang simpel dan terintegrasi dari awal hingga
              akhir.
            </p>
          </div>

          {/* Steps — Gestalt Continuity: the number sequence creates visual flow */}
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="relative">
                {/* Connector line — Continuity principle */}
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-5 left-[calc(100%-16px)] w-[calc(100%-32px)] border-t-2 border-dashed border-border z-0" />
                )}

                <div className="relative z-10">
                  {/* Step number — clear sequential indicator */}
                  <div className="size-10 rounded-xl bg-linear-to-br from-primary to-secondary text-white text-sm font-bold flex items-center justify-center mb-5">
                    {step.number}
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          CTA — Final conversion point.
          Heuristic: Fitts's Law (large button area), Hick's Law (2 options),
          Nielsen #4 Consistency (reuses same gradient).
          ════════════════════════════════════════════════════════════════ */}
      <section className="w-full py-24 md:py-32">
        <div className="max-w-7xl w-full mx-auto px-8 sm:px-12 md:px-16 lg:px-24 xl:px-32">
          <div className="rounded-2xl bg-linear-to-br from-primary via-red-900 to-secondary p-10 md:p-16">
            <div className="max-w-xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 tracking-tight">
                Kelola Kehadiran Magang Secara Digital
              </h2>
              <p className="text-white/70 text-base leading-relaxed mb-8 max-w-md mx-auto">
                Platform absensi modern untuk Diskominfo Kota Makassar. Pantau
                kehadiran, kelola jadwal, dan hasilkan laporan — semua dalam
                satu sistem yang terintegrasi.
              </p>
              {/* Two actions — Hick's Law: minimal choices */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link href="/auth/sign-up">
                  <Button
                    size="lg"
                    className="h-12 px-7 text-base font-semibold bg-white text-primary hover:bg-white/90 rounded-xl transition-all"
                  >
                    Daftar
                    <ArrowRight className="ml-2 size-4" />
                  </Button>
                </Link>
                <Link href="/auth/sign-in">
                  <Button
                    size="lg"
                    variant="ghost"
                    className="h-12 px-7 text-base font-medium text-white/80 border border-white/20 rounded-xl hover:bg-white/10"
                  >
                    Masuk
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          FOOTER
          Heuristic: Nielsen #2 (Match real world — real address & email),
          Gestalt Proximity (grouped columns).
          ════════════════════════════════════════════════════════════════ */}
      <footer className="w-full border-t py-12 bg-card">
        <div className="max-w-7xl w-full mx-auto px-8 sm:px-12 md:px-16 lg:px-24 xl:px-32">
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8 mb-8">
            {/* Brand column */}
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <Logo textClassName="text-foreground font-bold" />
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                Sistem absensi digital terintegrasi untuk peserta magang
                Pemerintah Kota Makassar.
              </p>
            </div>

            {/* Links column */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">
                Tautan
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/auth/sign-in"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Masuk
                  </Link>
                </li>
                <li>
                  <Link
                    href="/auth/sign-up"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Daftar
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact column */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">
                Kontak
              </h4>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="size-3.5 shrink-0" />
                  <a
                    href="mailto:diskominfo@makassarkota.go.id"
                    className="hover:text-foreground transition-colors"
                  >
                    diskominfo@makassarkota.go.id
                  </a>
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Globe className="size-3.5 shrink-0" />
                  <a
                    href="https://diskominfo.makassarkota.go.id"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors"
                  >
                    diskominfo.makassarkota.go.id
                  </a>
                </li>
                <li className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPinned className="size-3.5 shrink-0 mt-0.5" />
                  <span>
                    Gedung MGC Lt. 7 Jl Sultan Hasanuddin Kota Makassar 90171
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t pt-6">
            <p className="text-xs text-muted-foreground">
              &copy; 2026 Diskominfo Kota Makassar. Hak cipta dilindungi.
            </p>
          </div>
        </div>
      </footer>

      <ScrollToTopButton />
    </div>
  );
}
