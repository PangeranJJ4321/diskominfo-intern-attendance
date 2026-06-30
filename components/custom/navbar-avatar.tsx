"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import { useTheme } from "next-themes";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Sun, Moon, User, LogIn } from "lucide-react";
import { Switch } from "@/components/ui/switch";

/**
 * Renders the navigation bar user menu buttons (Masuk/Daftar or Keluar/Dashboard)
 * and theme toggle button, styled exactly like GitLab's navbar.
 *
 * @returns {React.JSX.Element} The rendered NavbarAvatar component.
 */
interface NavbarAvatarProps {
  isTransparent?: boolean;
  mobile?: boolean;
}

export function NavbarAvatar({ isTransparent = false, mobile = false }: NavbarAvatarProps) {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  /**
   * Toggles the application theme between light and dark modes.
   */
  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  /**
   * Signs the user out of the application and redirects to the sign-in page.
   */
  const handleLogout = async () => {
    setIsLoading(true);
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/auth/sign-in");
        },
      },
    });
    setIsLoading(false);
  };

  // Loading skeleton to avoid layout shift
  if (!mounted) {
    return mobile ? (
      <div className="flex flex-col gap-3 w-full mt-4 border-t border-border/10 pt-4">
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-8 w-24 rounded-lg mt-2" />
        <Skeleton className="h-10 w-full rounded-lg mt-4" />
      </div>
    ) : (
      <div className="flex items-center gap-3 p-1">
        <Skeleton className="h-9 w-9 rounded-full" />
        <Skeleton className="h-8 w-16 rounded-lg" />
        <Skeleton className="h-8 w-16 rounded-lg" />
      </div>
    );
  }

  if (isPending) {
    return mobile ? (
      <div className="flex flex-col gap-3 w-full mt-4 border-t border-border/10 pt-4">
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-8 w-24 rounded-lg mt-2" />
        <Skeleton className="h-10 w-full rounded-lg mt-4" />
      </div>
    ) : (
      <div className="flex items-center gap-3 p-1">
        <Skeleton className="h-9 w-9 rounded-full" />
        <Skeleton className="h-8 w-16 rounded-lg" />
        <Skeleton className="h-8 w-16 rounded-lg" />
      </div>
    );
  }

  const user = session?.user ?? null;

  if (mobile) {
    return (
      <div className="flex flex-col gap-2 w-full mt-2">
        {/* Auth Buttons */}
        {user ? (
          <>
            <Link
              id="navbar-dashboard-link-mobile"
              href="/dashboard"
              className="flex items-center gap-3 p-3 text-primary bg-primary/10 hover:bg-primary/15 rounded-lg font-medium text-base transition-colors"
            >
              <User className="size-5 text-primary" />
              Dashboard
            </Link>
            <button
              id="navbar-sign-out-mobile"
              onClick={handleLogout}
              disabled={isLoading}
              className="flex items-center gap-3 p-3 text-muted-foreground hover:text-foreground font-medium text-base transition-colors w-full text-left cursor-pointer disabled:opacity-50"
            >
              <LogIn className="size-5" />
              {isLoading ? "Keluar..." : "Keluar"}
            </button>
          </>
        ) : (
          <>
            <Link
              id="navbar-sign-up-link-mobile"
              href="/auth/sign-up"
              className="flex items-center gap-3 p-3 text-primary bg-primary/10 hover:bg-primary/15 rounded-lg font-semibold text-base transition-colors"
            >
              <User className="size-5 text-primary" />
              Daftar
            </Link>
            <Link
              id="navbar-sign-in-link-mobile"
              href="/auth/sign-in"
              className="flex items-center gap-3 p-3 text-muted-foreground hover:text-foreground font-medium text-base transition-colors"
            >
              <LogIn className="size-5" />
              Masuk
            </Link>
          </>
        )}

        {/* Theme Toggle in Mobile */}
        <div className="flex items-center justify-between p-3 mt-1 border-t border-border/10">
          <div className="flex items-center gap-3">
            <Moon className="size-5 text-muted-foreground" />
            <span className="font-medium text-base text-foreground">Mode Gelap</span>
          </div>
          <Switch
            checked={resolvedTheme === "dark"}
            onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-6 p-1">
      {/* Auth Buttons */}
      {user ? (
        <div className="hidden md:flex items-center gap-6">
          <Link
            id="navbar-sign-in-link"
            href="/auth/sign-in"
            onClick={(e) => {
              e.preventDefault();
              handleLogout();
            }}
            className={`flex items-center gap-2 text-sm font-medium transition-all cursor-pointer ${
              isTransparent 
                ? "text-white hover:text-white/80" 
                : "text-foreground hover:opacity-85"
            }`}
          >
            <LogIn className="size-4" />
            Keluar
          </Link>

          <Link
            id="navbar-dashboard-link"
            href="/dashboard"
            className={`${
              isTransparent
                ? "bg-white text-primary hover:bg-white/95"
                : "bg-white border border-primary text-primary hover:bg-primary/5"
            } px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-xs flex items-center gap-2`}
          >
            <User className="size-4" />
            Dashboard
          </Link>
        </div>
      ) : (
        <div className="hidden md:flex items-center gap-6">
          <Link
            id="navbar-sign-in-link"
            href="/auth/sign-in"
            className={`flex items-center gap-2 text-sm font-medium transition-all cursor-pointer ${
              isTransparent 
                ? "text-white hover:text-white/80" 
                : "text-foreground hover:opacity-85"
            }`}
          >
            <LogIn className="size-4" />
            Masuk
          </Link>

          <Link
            id="navbar-sign-up-link"
            href="/auth/sign-up"
            className={`${
              isTransparent
                ? "bg-white text-primary hover:bg-white/95"
                : "bg-white border border-primary text-primary hover:bg-primary/5"
            } px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-xs flex items-center gap-2`}
          >
            <User className="size-4" />
            Daftar
          </Link>
        </div>
      )}

      {/* Theme Toggle Button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            id="navbar-theme-toggle"
            onClick={toggleTheme}
            className={`rounded-full p-2.5 flex items-center justify-center transition-all cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring ${
              isTransparent
                ? "bg-white/10 hover:bg-white/20 text-white"
                : "bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 text-foreground"
            }`}
            aria-label="Ubah tema"
          >
            {resolvedTheme === "dark" ? (
              <Sun className="h-4.5 w-4.5 transition-transform hover:scale-110" />
            ) : (
              <Moon className="h-4.5 w-4.5 transition-transform hover:scale-110" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {resolvedTheme === "dark" ? "Mode Terang" : "Mode Gelap"}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
