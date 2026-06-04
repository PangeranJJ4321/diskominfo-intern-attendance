import { useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollToTopButton } from "@/components/custom/scroll-to-top-button";
import { LandingNavbar } from "@/components/custom/landing-navbar";
import { ScrollToSectionButton } from "@/components/custom/scroll-to-section-button";
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
 */
export default function HomePage() {
  const t = useTranslations("landing");

  const features = [
    {
      icon: ScanFace,
      title: t("features.faceRecognition.title"),
      description: t("features.faceRecognition.description"),
    },
    {
      icon: MapPin,
      title: t("features.locationTracking.title"),
      description: t("features.locationTracking.description"),
    },
    {
      icon: CalendarClock,
      title: t("features.scheduling.title"),
      description: t("features.scheduling.description"),
    },
    {
      icon: FileSpreadsheet,
      title: t("features.reporting.title"),
      description: t("features.reporting.description"),
    },
    {
      icon: ShieldCheck,
      title: t("features.multiRole.title"),
      description: t("features.multiRole.description"),
    },
    {
      icon: Activity,
      title: t("features.realtime.title"),
      description: t("features.realtime.description"),
    },
  ];

  const steps = [
    {
      number: "01",
      title: t("howItWorks.step1.title"),
      description: t("howItWorks.step1.description"),
    },
    {
      number: "02",
      title: t("howItWorks.step2.title"),
      description: t("howItWorks.step2.description"),
    },
    {
      number: "03",
      title: t("howItWorks.step3.title"),
      description: t("howItWorks.step3.description"),
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background font-sans">
      <LandingNavbar />

      {/* ════════════════════════════════════════════════════════════════
          HERO — Full-viewport gradient matching sign-in left panel.
          Heuristic: Nielsen #4 Consistency, Fitts's Law (large CTA),
          Hick's Law (only 2 actions).
          ════════════════════════════════════════════════════════════════ */}
      <section className="w-full relative min-h-[100dvh] flex items-center overflow-hidden">
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
                {t("hero.badge")}
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1] tracking-tight mb-6">
                {t("hero.title")}
              </h1>

              <p className="text-lg text-white/70 leading-relaxed mb-10 max-w-md">
                {t("hero.description")}
              </p>

              {/* CTAs — Fitts: large targets, high contrast primary action */}
              <div className="flex flex-wrap items-center gap-3">
                <Link href="/auth/sign-in">
                  <Button
                    size="lg"
                    className="h-12 px-7 text-base font-semibold bg-white text-primary hover:bg-white/90 rounded-xl transition-all"
                  >
                    {t("hero.cta")}
                    <ArrowRight className="ml-2 size-4" />
                  </Button>
                </Link>
                <ScrollToSectionButton
                  targetId="features"
                  className="h-12 px-7 text-base font-medium text-white/80 border border-white/20 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                  id="hero-secondary-cta"
                >
                  {t("hero.ctaSecondary")}
                </ScrollToSectionButton>
              </div>
            </div>

            {/* Right — Brand identity card (provides visual anchor) */}
            <div className="hidden lg:flex justify-end">
              <div className="relative w-80">
                {/* Floating card — shows the product identity */}
                <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-8">
                  <div className="size-16 rounded-2xl overflow-hidden ring-2 ring-white/20 mb-6">
                    <Image
                      src="/intern-logo.jpeg"
                      alt="Diskominfo Logo"
                      width={64}
                      height={64}
                      className="object-cover"
                    />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Diskominfo Makassar
                  </h3>
                  <p className="text-sm text-white/60 leading-relaxed mb-6">
                    {t("footer.description")}
                  </p>
                  {/* Mini feature list for quick scanning */}
                  <ul className="space-y-3">
                    {[
                      t("features.faceRecognition.title"),
                      t("features.locationTracking.title"),
                      t("features.realtime.title"),
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
              {t("features.sectionBadge")}
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-4">
              {t("features.sectionTitle")}
            </h2>
            <p className="text-muted-foreground text-base leading-relaxed">
              {t("features.sectionDescription")}
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
      <section id="how-it-works" className="w-full py-24 md:py-32 bg-muted/40 scroll-mt-20">
        <div className="max-w-7xl w-full mx-auto px-8 sm:px-12 md:px-16 lg:px-24 xl:px-32">
          <div className="max-w-xl mb-14">
            <p className="text-sm font-semibold text-secondary uppercase tracking-wider mb-3">
              {t("howItWorks.sectionBadge")}
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-4">
              {t("howItWorks.sectionTitle")}
            </h2>
            <p className="text-muted-foreground text-base leading-relaxed">
              {t("howItWorks.sectionDescription")}
            </p>
          </div>

          {/* Steps — Gestalt Continuity: the number sequence creates visual flow */}
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="relative">
                {/* Connector line — Continuity principle */}
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-5 left-[calc(100%_-_16px)] w-[calc(100%_-_32px)] border-t-2 border-dashed border-border z-0" />
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
              <Image
                src="/intern-logo.jpeg"
                alt="Diskominfo Logo"
                width={56}
                height={56}
                className="mx-auto mb-6 rounded-xl ring-2 ring-white/20"
              />
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 tracking-tight">
                {t("hero.title")}
              </h2>
              <p className="text-white/70 text-base leading-relaxed mb-8 max-w-md mx-auto">
                {t("hero.description")}
              </p>
              {/* Two actions — Hick's Law: minimal choices */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link href="/auth/sign-up">
                  <Button
                    size="lg"
                    className="h-12 px-7 text-base font-semibold bg-white text-primary hover:bg-white/90 rounded-xl transition-all"
                  >
                    {t("footer.signUp")}
                    <ArrowRight className="ml-2 size-4" />
                  </Button>
                </Link>
                <Link href="/auth/sign-in">
                  <Button
                    size="lg"
                    variant="ghost"
                    className="h-12 px-7 text-base font-medium text-white/80 border border-white/20 rounded-xl hover:bg-white/10"
                  >
                    {t("footer.signIn")}
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
                <Image
                  src="/intern-logo.jpeg"
                  alt="Logo"
                  width={28}
                  height={28}
                  className="rounded-md ring-1 ring-foreground/10"
                />
                <span className="font-semibold text-sm text-foreground">
                  {t("footer.brand")}
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                {t("footer.description")}
              </p>
            </div>

            {/* Links column */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">
                {t("footer.links")}
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/auth/sign-in"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {t("footer.signIn")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/auth/sign-up"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {t("footer.signUp")}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact column */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">
                {t("footer.contact")}
              </h4>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="size-3.5 shrink-0" />
                  <a href={`mailto:${t("footer.contactEmail")}`} className="hover:text-foreground transition-colors">
                    {t("footer.contactEmail")}
                  </a>
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Globe className="size-3.5 shrink-0" />
                  <a
                    href={`https://${t("footer.contactWebsite")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors"
                  >
                    {t("footer.contactWebsite")}
                  </a>
                </li>
                <li className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPinned className="size-3.5 shrink-0 mt-0.5" />
                  <span>{t("footer.contactAddress")}</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t pt-6">
            <p className="text-xs text-muted-foreground">
              {t("footer.copyright")}
            </p>
          </div>
        </div>
      </footer>

      <ScrollToTopButton />
    </div>
  );
}
