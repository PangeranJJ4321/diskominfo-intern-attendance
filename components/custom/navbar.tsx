"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { LogOut, LogIn, UserPlus } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { Menu } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface NavbarProps {
  children?: ReactNode;
}

function useSidebarOptional() {
  try {
    return useSidebar();
  } catch {
    return null;
  }
}

export function Navbar({ children }: NavbarProps) {
  const sidebar = useSidebarOptional();
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);

  // Extract locale from current pathname
  const locale = pathname.split("/")[1] || "en";

  const user = session?.user;

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            router.push(`/${locale}/auth/sign-in`);
          },
        },
      });
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoading(false);
    }
  };

  const handleProfileClick = () => {
    if (user?.id) {
      router.push(`/${locale}/user/${user.id}`);
    }
  };

  const initials = getInitials(user?.name);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card backdrop-blur supports-backdrop-filter:bg-card/60">
      <div className="container mx-auto flex h-auto items-center justify-between">
        {/* Left side: Sidebar toggle + Brand/Children */}
        <div className="flex items-center gap-4">
          {sidebar && (
            <Button
              variant="ghost"
              size="icon"
              onClick={sidebar.toggleSidebar}
              className="h-9 w-9 ml-4"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          {children}
        </div>

        {/* Right side: Profile menu - only show if no sidebar */}
        {!sidebar && (
          <div className="flex items-center gap-4 p-3">
            <TooltipProvider>
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <button className="rounded-full p-0 focus-visible:ring-2">
                        <Avatar>
                          <AvatarImage
                            src={user?.image ?? undefined}
                            alt={user?.name ?? "User avatar"}
                          />
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                      </button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {user?.name || "Account"}
                  </TooltipContent>
                </Tooltip>

                <DropdownMenuContent align="end" className="w-56">
                  {user ? (
                    <>
                      <DropdownMenuItem asChild>
                        <button
                          onClick={handleProfileClick}
                          className="flex w-full cursor-pointer items-center gap-2"
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={user.image ?? undefined}
                              alt={user.name ?? "User avatar"}
                            />
                            <AvatarFallback>{initials}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col text-left">
                            <span className="text-sm font-medium">
                              {user.name}
                            </span>
                            {user.email && (
                              <span className="text-xs text-muted-foreground">
                                {user.email}
                              </span>
                            )}
                          </div>
                        </button>
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        onClick={handleLogout}
                        disabled={isLoading}
                        className="flex cursor-pointer items-center gap-2 text-red-600"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>{isLoading ? "Logging out..." : "Logout"}</span>
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/${locale}/auth/sign-in`}
                          className="flex cursor-pointer items-center gap-2"
                        >
                          <LogIn className="h-4 w-4" />
                          <span>Sign In</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/${locale}/auth/sign-up`}
                          className="flex cursor-pointer items-center gap-2"
                        >
                          <UserPlus className="h-4 w-4" />
                          <span>Sign Up</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </TooltipProvider>
          </div>
        )}
      </div>
    </header>
  );
}
