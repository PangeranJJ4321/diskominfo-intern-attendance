"use client";

import Link from "next/link";
import Image from "next/image";
import { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/auth-client";
import { LogoutButton } from "./logout-button";

export interface MenuItem {
  icon: ReactNode;
  label: string;
  href: string; // Base path without locale (e.g., "/dashboard")
  matchExact?: boolean; // Set to true if it shouldn't match child routes
}

interface CustomSidebarProps {
  className?: string;
  menuItems: MenuItem[];
  userDisplayNameDefault?: string;
  userSubtitleKey?: string;
}

export function CustomSidebar({
  className,
  menuItems,
  userDisplayNameDefault = "User",
  userSubtitleKey = "common.home",
}: CustomSidebarProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations();

  // Extract locale from current pathname
  const locale = pathname.split("/")[1] || "en";

  // Helper to accurately check if a route is active
  const checkIsActive = (href: string, matchExact?: boolean) => {
    // Strip the locale from the current pathname for clean comparison
    const currentPath = pathname.replace(new RegExp(`^/${locale}`), "") || "/";

    if (matchExact) {
      return currentPath === href;
    }
    return currentPath === href || currentPath.startsWith(`${href}/`);
  };

  return (
    <Sidebar className={className}>
      {/* Header with Logo */}
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 px-2">
          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center overflow-hidden">
            <Image
              src="/intern-logo.jpeg"
              alt="Kominfo Logo"
              width={40}
              height={40}
              className="object-cover"
            />
          </div>
          <span className="text-2xl font-bold text-gray-900">Kominfo</span>
        </div>
      </SidebarHeader>

      {/* Main Content */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item, index) => {
                const isActive = checkIsActive(item.href, item.matchExact);
                const localizedHref = `/${locale}${item.href}`;

                return (
                  <SidebarMenuItem key={index}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={cn(
                        "relative my-1 h-10 px-4 text-sm font-medium text-slate-700 transition-all duration-700 ease-in-out hover:bg-linear-to-l hover:from-primary/25 hover:to-secondary/30 hover:text-foreground [&_svg]:size-5 [&_svg]:text-slate-500 hover:[&_svg]:text-[#63b7b1] [&>span]:truncate [&>span]:whitespace-nowrap",
                        isActive &&
                          "bg-linear-to-l from-primary/20 to-secondary/25 font-semibold text-foreground [&_svg]:text-[#63b7b1]",
                      )}
                    >
                      <Link
                        href={localizedHref}
                        className="relative overflow-visible"
                      >
                        {isActive && (
                          <span
                            aria-hidden="true"
                            className="absolute left-0 top-0 bottom-0 w-1 rounded-l-full bg-[#8e2f33] shadow-[inset_2px_0_6px_rgba(0,0,0,0.2),inset_-2px_0_3px_rgba(142,47,51,0.4)]"
                          />
                        )}
                        <span className="relative flex items-center gap-2">
                          {item.icon}
                          <span>{item.label}</span>
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer with User Info */}
      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <div
              className="px-2 py-2 mb-2 cursor-pointer hover:bg-gray-100 rounded-md transition-colors"
              onClick={() => {
                if (session?.user?.id) {
                  router.push(`/${locale}/user/${session.user.id}`);
                }
              }}
            >
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white text-xs font-bold">
                  {session?.user?.name?.[0] || userDisplayNameDefault?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {session?.user?.name || userDisplayNameDefault}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {t(userSubtitleKey)}
                  </p>
                </div>
              </div>
            </div>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <LogoutButton />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
