"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Landing page navbar.
 *
 * Heuristic: Nielsen #1 (Visibility of system status — scroll indicator via bg change),
 * Nielsen #7 (Flexibility — both nav links and mobile menu), Fitts's Law (adequate tap targets).
 */
export function LandingNavbar() {
  const t = useTranslations("landing.navbar");
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    setIsMobileOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-background/95 backdrop-blur-sm border-b border-border shadow-sm"
          : "bg-transparent border-b border-transparent",
      )}
    >
      <div className="max-w-7xl w-full mx-auto flex h-16 items-center justify-between px-8 sm:px-12 md:px-16 lg:px-24 xl:px-32">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg overflow-hidden ring-1 ring-white/20">
            <Image
              src="/intern-logo.jpeg"
              alt="Logo"
              width={32}
              height={32}
              className="object-cover"
            />
          </div>
          <span
            className={cn(
              "font-semibold text-sm hidden sm:inline transition-colors",
              isScrolled ? "text-foreground" : "text-white",
            )}
          >
            Diskominfo Makassar
          </span>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {(["features", "howItWorks"] as const).map((key) => (
            <button
              key={key}
              onClick={() =>
                scrollTo(key === "howItWorks" ? "how-it-works" : key)
              }
              className={cn(
                "px-3 py-1.5 text-sm font-medium transition-colors rounded-lg",
                isScrolled
                  ? "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  : "text-white/70 hover:text-white hover:bg-white/10",
              )}
            >
              {t(key)}
            </button>
          ))}
        </nav>

        {/* Desktop CTA — Fitts: adequate size for easy clicking */}
        <div className="hidden md:flex items-center gap-2">
          <Link href="/auth/sign-in">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "text-sm",
                !isScrolled &&
                  "text-white/80 hover:text-white hover:bg-white/10",
              )}
            >
              {t("signIn")}
            </Button>
          </Link>
          <Link href="/auth/sign-up">
            <Button
              size="sm"
              className={cn(
                "text-sm",
                !isScrolled &&
                  "bg-white text-primary hover:bg-white/90",
              )}
            >
              {t("signUp")}
            </Button>
          </Link>
        </div>

        {/* Mobile toggle */}
        <Button
          variant="ghost"
          size="icon-sm"
          className={cn("md:hidden", !isScrolled && "text-white hover:bg-white/10")}
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          aria-label="Toggle menu"
        >
          {isMobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>
      </div>

      {/* Mobile menu */}
      {isMobileOpen && (
        <div className="md:hidden bg-background border-b border-border shadow-sm">
          <div className="max-w-7xl w-full mx-auto px-8 py-3 flex flex-col gap-1">
            <button
              onClick={() => scrollTo("features")}
              className="px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors text-left rounded-lg hover:bg-muted/50"
            >
              {t("features")}
            </button>
            <button
              onClick={() => scrollTo("how-it-works")}
              className="px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors text-left rounded-lg hover:bg-muted/50"
            >
              {t("howItWorks")}
            </button>
            <div className="flex gap-2 pt-2 mt-1 border-t border-border">
              <Link href="/auth/sign-in" className="flex-1">
                <Button variant="outline" size="sm" className="w-full text-sm">
                  {t("signIn")}
                </Button>
              </Link>
              <Link href="/auth/sign-up" className="flex-1">
                <Button variant="default" size="sm" className="w-full text-sm">
                  {t("signUp")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
