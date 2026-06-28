"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import { getInitials } from "@/lib/string-utils";
import { useTheme } from "next-themes";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/avatar";
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
import { LogOut, LogIn, UserPlus, User, Sun, Moon, Monitor } from "lucide-react";


/**
 * Renders the navigation bar avatar component containing user profile info and actions.
 *
 * @returns {React.JSX.Element} The rendered NavbarAvatar component.
 */
export function NavbarAvatar() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const user = session?.user ?? null;
  const initials = user?.name ? getInitials(user.name) : null;

  const handleProfileClick = () => {
    if (user?.id) {
      router.push(`/profile/${user.id}`);
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
  if (!mounted || isPending) {
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
                    src={user?.image || undefined}
                    alt={user?.name ?? "User avatar"}
                  />
                  <AvatarFallback>
                    {initials ?? <User className="size-4" />}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {user?.name || "Akun"}
          </TooltipContent>
        </Tooltip>

        <DropdownMenuContent align="end" className="w-56">
          {user && (
            <>
              <DropdownMenuItem asChild>
                <button
                  id="navbar-profile-link"
                  onClick={handleProfileClick}
                  className="flex w-full cursor-pointer items-center gap-2"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={user.image || undefined}
                      alt={user.name ?? "User avatar"}
                    />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col text-left">
                    <span className="text-sm font-medium">{user.name}</span>
                    {user.email && (
                      <span className="text-xs text-muted-foreground">
                        {user.email}
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
            <DropdownMenuRadioItem value="system" className="gap-2 cursor-pointer">
              <Monitor className="size-4" />
              <span>Sistem</span>
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="light" className="gap-2 cursor-pointer">
              <Sun className="size-4" />
              <span>Terang</span>
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark" className="gap-2 cursor-pointer">
              <Moon className="size-4" />
              <span>Gelap</span>
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>

          <DropdownMenuSeparator />

          {user ? (
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
