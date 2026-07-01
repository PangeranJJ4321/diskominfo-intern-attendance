"use client";

import { usePathname } from "next/navigation";
import { NavbarAvatar } from "./navbar-avatar";
import { Logo } from "./logo";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Renders the navigation bar with logo, dynamic menu links, and user settings/avatar.
 *
 * @returns {React.JSX.Element} The rendered Navbar component.
 */
export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user ?? null;
  
  // Menentukan ke mana klik Logo akan mengarah
  const isAdmin = pathname.startsWith("/admin");
  const logoHref = isAdmin 
    ? "/admin" 
    : "/dashboard";

  // Dynamic links based on user status
  const links = [];
  if (!user) {
    links.push(
      { name: "Beranda", href: "/" },
    );
  }

  const isDashboardOrAdmin = pathname.startsWith("/dashboard") || pathname.startsWith("/admin") || pathname.startsWith("/profile");

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full border-b transition-all duration-300",
      isDashboardOrAdmin 
        ? "bg-primary text-white border-primary/20" 
        : "border-border/10 bg-transparent"
    )}>
      <div className="w-full flex h-16 items-center justify-between px-4 md:px-6 lg:px-8">
        {/* ── Brand & Links (GitLab Style) ── */}
        <div className="flex items-center gap-8 h-full">
          <Logo 
            href={logoHref} 
            textClassName={isDashboardOrAdmin ? "text-white font-bold" : "text-foreground font-bold"}
          />
          {links.length > 0 && (
            <nav className="hidden md:flex items-center gap-6 h-full">
              {links.map((link) => {
                // Exact check for '/', otherwise prefix check
                const isActive = link.href === "/" 
                  ? pathname === "/" 
                  : pathname.startsWith(link.href);
                
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "transition-all h-full flex items-center px-1 text-base font-medium border-b-2 pt-0.5",
                      isDashboardOrAdmin
                        ? (isActive 
                          ? "text-white border-white font-semibold" 
                          : "text-white/70 border-transparent hover:text-white hover:border-white/40")
                        : (isActive 
                          ? "text-foreground border-primary font-semibold" 
                          : "text-muted-foreground border-transparent hover:border-muted-foreground/35")
                    )}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        {/* ── Right side: avatar / user menu ── */}
        <NavbarAvatar />
      </div>
    </header>
  );
}
