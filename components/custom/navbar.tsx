"use client";

import { usePathname } from "next/navigation";
import { NavbarAvatar } from "./navbar-avatar";
import { Logo } from "./logo";

import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  
  // Menentukan ke mana klik Logo akan mengarah
  const isAdmin = pathname.startsWith("/admin");
  const logoHref = isAdmin 
    ? "/admin" 
    : pathname.startsWith("/dashboard") 
      ? "/dashboard" 
      : "/dashboard"; // default untuk profile/dll

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
      <div className={cn(
        "flex h-14 items-center justify-between px-4",
        isAdmin ? "w-full lg:px-6" : "w-full max-w-7xl mx-auto md:px-8"
      )}>
        {/* ── Brand ── */}
        <Logo href={logoHref} />

        {/* ── Right side: avatar / user menu ── */}
        <NavbarAvatar />
      </div>
    </header>
  );
}
