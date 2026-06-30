"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  MapIcon, 
  CalendarDays, 
  Users, 
  Settings,
  GraduationCap,
  User
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
    title: "Institusi Asal",
    url: "institutions",
    icon: GraduationCap,
  },
  {
    title: "Profil Saya",
    url: "profile",
    icon: User,
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
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-white/40 font-semibold tracking-wider uppercase text-[10px]">Menu Utama</SidebarGroupLabel>
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
                      className={isActive ? "bg-white/15 text-white hover:bg-white/20 font-semibold transition-colors py-2.5" : "text-white/70 hover:text-white hover:bg-white/10 transition-colors py-2.5"}
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
