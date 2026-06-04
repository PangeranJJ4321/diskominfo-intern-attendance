import type { ReactNode } from "react";

import { LayoutDashboard, Users, Building2, Briefcase } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { CustomSidebar } from "@/components/custom/custom-sidebar";
import { redirect } from "@/i18n/navigation";
import { getSession } from "@/lib/dal";
import { Navbar } from "@/components/custom/navbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import type { MenuItem } from "@/components/custom/custom-sidebar";

type TranslationFunction = Awaited<ReturnType<typeof getTranslations>>;

function getSidebarMenuItems(role: string, t: TranslationFunction): MenuItem[] {
  switch (role) {
    case "SUPERADMIN":
      return [
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
    case "ADMIN":
      return [
        {
          icon: <LayoutDashboard className="h-5 w-5" />,
          label: t("sidebar.admin.dashboard"),
          href: "/dashboard/admin",
          matchExact: true,
        },
        {
          icon: <Building2 className="h-5 w-5" />,
          label: t("sidebar.admin.agencies"),
          href: "/dashboard/admin/agencies",
        },
      ];
    default:
      return [
        {
          icon: <LayoutDashboard className="h-5 w-5" />,
          label: t("sidebar.intern.dashboard"),
          href: "/dashboard",
          matchExact: true,
        },
      ];
  }
}

export default async function UserLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string; userId: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();

  if (!session) {
    redirect({ href: "/auth/sign-in", locale });
  }

  const authenticatedSession = session!;
  const t = await getTranslations();
  const menuItems = getSidebarMenuItems(authenticatedSession.user.role, t);

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex min-h-screen w-full bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.95),rgba(241,245,249,1)_42%,rgba(226,232,240,0.92)_100%)] text-foreground">
        <CustomSidebar
          menuItems={menuItems}
          userDisplayNameDefault={authenticatedSession.user.name ?? "User"}
          userSubtitleKey="common.settings"
        />

        <SidebarInset>
          <Navbar>
            <div className="flex flex-col p-3">
              <span className="text-sm font-semibold tracking-tight">
                User profile
              </span>
              <span className="text-xs text-muted-foreground">
                Account overview and access details
              </span>
            </div>
          </Navbar>

          <main className="flex flex-1 justify-center p-4 sm:p-6">
            <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
