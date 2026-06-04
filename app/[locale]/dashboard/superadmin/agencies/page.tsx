"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import { CustomSidebar } from "@/components/custom/custom-sidebar";
import { Navbar } from "@/components/custom/navbar";
import { AgenciesTable } from "../components/agencies-table";
import { useTranslations } from "next-intl";
import { LayoutDashboard, Users, Building2, Briefcase } from "lucide-react";

export default function SuperAdminAgencyPage() {
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
        <main className="flex-1 overflow-auto">
          <Navbar>
            <div className="p-3">
              <h1 className="text-2xl font-bold">Manage Agencies</h1>
              <p className="text-gray-600">View and manage all agencies</p>
            </div>
          </Navbar>
          <div className="space-y-4 p-6 pt-0">
            <AgenciesTable initialLimit={15} />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
