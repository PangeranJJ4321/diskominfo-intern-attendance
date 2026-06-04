"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import { CustomSidebar } from "@/components/custom/custom-sidebar"; // Adjust path if needed
import { LayoutDashboard, Users, Building2, Briefcase } from "lucide-react";
import { useTranslations } from "next-intl";

export default function SuperAdminDashboardPage() {
  const t = useTranslations();

  const superAdminMenuItems = [
    {
      icon: <LayoutDashboard className="h-5 w-5" />,
      label: t("sidebar.superAdmin.dashboard"),
      href: "/dashboard/superadmin",
      matchExact: true,
    },
    {
      icon: <Users className="h-5 w-5" />,
      label: t("sidebar.superAdmin.manageUsers"),
      href: "/dashboard/superadmin/users",
    },
    {
      icon: <Building2 className="h-5 w-5" />,
      label: t("sidebar.superAdmin.institutions"),
      href: "/dashboard/superadmin/institutions",
    },
    {
      icon: <Briefcase className="h-5 w-5" />,
      label: t("sidebar.superAdmin.agencies"),
      href: "/dashboard/superadmin/agencies",
    },
  ];

  return (
    <SidebarProvider>
      <div className="flex w-full">
        <CustomSidebar
          menuItems={superAdminMenuItems}
          userDisplayNameDefault="Super Admin"
          userSubtitleKey="common.settings"
        />
        <main className="flex-1 overflow-auto p-8">
          <div className="space-y-4">
            <div>
              <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Manage users, institutions, and agencies using the sidebar
                navigation
              </p>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
