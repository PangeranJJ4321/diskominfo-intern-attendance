import { NavbarAvatar } from "./navbar-avatar";
import { Logo } from "./logo";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 md:px-8">
        {/* ── Brand ── */}
        <Logo hideTextOnMobile />

        {/* ── Right side: avatar / user menu ── */}
        <NavbarAvatar />
      </div>
    </header>
  );
}
