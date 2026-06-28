"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  MapIcon, 
  CalendarDays, 
  Users, 
  Settings
} from "lucide-react";
import { Logo } from "@/components/custom/logo";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

const adminNavigation = [
  {
    title: "Presensi Pengguna",
    url: "users",
    icon: Users,
  },
  {
    title: "Area Geografis",
    url: "area",
    icon: MapIcon,
  },
  {
    title: "Jadwal & Shift",
    url: "schedules",
    icon: CalendarDays,
  },
  {
    title: "Pengaturan Instansi",
    url: "settings",
    icon: Settings,
  },
];

export function AdminSidebar({ agencyId }: { agencyId: string }) {
  const pathname = usePathname();

  return (
    <Sidebar className="border-r-border/5" collapsible="icon">
      <SidebarHeader className="py-4 px-6 h-[72px] flex justify-center">
        <Logo href={`/admin/${agencyId}`} hideTextOnMobile={false} />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Utama</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminNavigation.map((item) => {
                const url = `/admin/${agencyId}/${item.url}`;
                const isActive = pathname.startsWith(url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      size="lg"
                      isActive={isActive}
                      className={isActive ? "bg-red-950/40 text-red-400 hover:bg-red-900/50 hover:text-red-300 transition-colors py-2.5" : "text-muted-foreground transition-colors hover:text-foreground py-2.5"}
                    >
                      <Link href={url} className="flex items-center gap-3">
                        <item.icon className="size-5" />
                        <span className="text-sm font-medium">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
