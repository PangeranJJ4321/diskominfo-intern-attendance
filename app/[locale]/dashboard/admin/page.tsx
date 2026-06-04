"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { SidebarProvider } from "@/components/ui/sidebar";
import { CustomSidebar } from "@/components/custom/custom-sidebar"; // Adjust path if you put it inside /custom
import { Navbar } from "@/components/custom/navbar";
import { LayoutDashboard, Building2 } from "lucide-react";
import { useTranslations } from "next-intl";

export default function AdminDashboardPage() {
  const t = useTranslations();
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const redirectToFirstAgency = async () => {
      if (!session?.user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/agencies?limit=1", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          setIsLoading(false);
          return;
        }

        const data = await response.json();
        const agencies = data.data || [];

        if (agencies.length > 0) {
          // Redirect to the first agency
          router.push(`/dashboard/admin/agencies/${agencies[0].id}`);
          return;
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching agencies:", error);
        setIsLoading(false);
      }
    };

    redirectToFirstAgency();
  }, [session?.user?.id, router]);

  // Show loading state while fetching or redirecting
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  const adminMenuItems = [
    {
      icon: <LayoutDashboard className="h-5 w-5" />,
      label: t("sidebar.admin.dashboard"),
      href: "/dashboard/admin",
      matchExact: true, // Highlights only when on exact "/dashboard/admin" route
    },
    {
      icon: <Building2 className="h-5 w-5" />,
      label: t("sidebar.admin.agencies"),
      href: "/dashboard/admin/agencies",
    },
  ];

  return (
    <SidebarProvider>
      <div className="flex w-full">
        <CustomSidebar
          menuItems={adminMenuItems}
          userDisplayNameDefault="Admin"
          userSubtitleKey="common.settings"
        />
        <main className="flex-1 overflow-auto">
          <Navbar>
            <div className="p-3">
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-gray-600">
                Manage interns, monitor attendance, and export reports using the
                sidebar navigation
              </p>
            </div>
          </Navbar>
          <div className="space-y-4 p-6 pt-0">
            {/* Dashboard content goes here */}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
