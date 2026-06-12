"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import { getInitials } from "@/lib/string-utils";
import { useTheme } from "next-themes";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  LogOut,
  LogIn,
  UserPlus,
  User,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { useProfileStore } from "@/stores/profile-store";

/**
 * Renders the navigation bar avatar component containing user profile info and actions.
 * Reads session from Better-Auth and supplements with the Zustand profile store
 * so that profile picture updates are reflected immediately without a page reload.
 *
 * @returns {React.JSX.Element} The rendered NavbarAvatar component.
 */
export function NavbarAvatar() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Read the stored profile user to get the latest avatar image / name.
  // Falls back to session data when the store is not populated (e.g. on non-profile pages).
  const storeUser = useProfileStore((s) => s.user);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const sessionUser = session?.user ?? null;

  // Prefer store values when available (they reflect the most recent edits),
  // otherwise fall back to the session-provided values
  const avatarImage = storeUser?.image ?? sessionUser?.image ?? undefined;
  const displayName = storeUser?.name ?? sessionUser?.name;
  const displayEmail = storeUser?.email ?? sessionUser?.email;
  const userId = storeUser?.id ?? sessionUser?.id;
  const initials = displayName ? getInitials(displayName) : null;

  const handleProfileClick = () => {
    if (userId) {
      router.push(`/profile/${userId}`);
    }
  };

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

  // Loading skeleton
  if (isPending) {
    return (
      <div className="flex items-center gap-4 p-3">
        <Skeleton className="size-8 rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 p-3">
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <button
                id="navbar-avatar-trigger"
                className="rounded-full p-0 focus-visible:ring-2"
                aria-label="Open user menu"
              >
                <Avatar>
                  <AvatarImage
                    src={avatarImage}
                    alt={displayName ?? "User avatar"}
                  />
                  <AvatarFallback>
                    {initials ?? <User className="size-4" />}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">{displayName || "Akun"}</TooltipContent>
        </Tooltip>

        <DropdownMenuContent align="end" className="w-56">
          {sessionUser && (
            <>
              <DropdownMenuItem asChild>
                <button
                  id="navbar-profile-link"
                  onClick={handleProfileClick}
                  className="flex w-full cursor-pointer items-center gap-2"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={avatarImage}
                      alt={displayName ?? "User avatar"}
                    />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col text-left">
                    <span className="text-sm font-medium">{displayName}</span>
                    {displayEmail && (
                      <span className="text-xs text-muted-foreground">
                        {displayEmail}
                      </span>
                    )}
                  </div>
                </button>
              </DropdownMenuItem>

              <DropdownMenuSeparator />
            </>
          )}

          {/* Theme selection style from Yousran/autograder */}
          <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground">
            <Monitor className="size-3.5" />
            <span>Tema</span>
          </DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={mounted ? (theme ?? "system") : "system"}
            onValueChange={setTheme}
          >
            <DropdownMenuRadioItem
              value="system"
              className="gap-2 cursor-pointer"
            >
              <Monitor className="size-4" />
              <span>Sistem</span>
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem
              value="light"
              className="gap-2 cursor-pointer"
            >
              <Sun className="size-4" />
              <span>Terang</span>
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem
              value="dark"
              className="gap-2 cursor-pointer"
            >
              <Moon className="size-4" />
              <span>Gelap</span>
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>

          <DropdownMenuSeparator />

          {sessionUser ? (
            <DropdownMenuItem
              id="navbar-sign-out"
              onClick={handleLogout}
              disabled={isLoading}
              className="flex cursor-pointer items-center gap-2 text-red-600"
            >
              <LogOut className="h-4 w-4" />
              <span>{isLoading ? "Keluar..." : "Keluar"}</span>
            </DropdownMenuItem>
          ) : (
            <>
              <DropdownMenuItem asChild>
                <Link
                  id="navbar-sign-in-link"
                  href="/auth/sign-in"
                  className="flex cursor-pointer items-center gap-2"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Masuk</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  id="navbar-sign-up-link"
                  href="/auth/sign-up"
                  className="flex cursor-pointer items-center gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Daftar</span>
                </Link>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
