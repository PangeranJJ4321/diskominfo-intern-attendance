import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import { SidebarProvider } from "@/components/ui/sidebar";
import { CustomSidebar } from "@/components/custom/custom-sidebar";
import { Navbar } from "@/components/custom/navbar";
import { LayoutDashboard, Building2 } from "lucide-react";
import { AddAgencyDialog } from "../../superadmin/components/add-agency-dialog";
import AgencyCard from "./components/agency-card";

type AgencyCount = {
  interns: number;
  agencyAccesses: number;
  agencyAreas: number;
};

type AgencyListItem = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  _count: AgencyCount;
};

type AgencyListResponse = {
  data: AgencyListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type AgencyLoadState = {
  data: AgencyListItem[];
  error: string | null;
};

function getBaseUrl(requestHeaders: Headers) {
  const origin = requestHeaders.get("origin");

  if (origin) {
    return origin;
  }

  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");

  if (!host) {
    return "http://localhost:3000";
  }

  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";

  return `${protocol}://${host}`;
}

async function getAgencies(): Promise<AgencyLoadState> {
  try {
    const requestHeaders = await headers();
    const response = await fetch(
      `${getBaseUrl(requestHeaders)}/api/agencies?limit=100`,
      {
        cache: "no-store",
        headers: {
          cookie: requestHeaders.get("cookie") ?? "",
        },
      },
    );

    if (!response.ok) {
      return {
        data: [],
        error:
          response.status === 401 || response.status === 403
            ? "You are not allowed to view agencies."
            : "Failed to load agencies.",
      };
    }

    const responseBody = (await response.json()) as AgencyListResponse;

    return {
      data: responseBody.data,
      error: null,
    };
  } catch {
    return {
      data: [],
      error: "Failed to load agencies.",
    };
  }
}

/**
 * Admin agencies page.
 */
export default async function AgenciesPage() {
  const t = await getTranslations();
  const agenciesState = await getAgencies();
  const agencies = agenciesState.data;

  const adminMenuItems = [
    {
      icon: <LayoutDashboard className="h-5 w-5" />,
      label: "Dashboard",
      href: "/dashboard/admin",
      matchExact: true,
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
              <h1 className="text-2xl font-bold">Manage Agencies</h1>
              <p className="text-gray-600">View and manage all agencies</p>
            </div>
          </Navbar>
          <div className="space-y-6 p-6 pt-0">
            <div className="flex justify-end px-6 pt-0">
              <AddAgencyDialog />
            </div>
            <div>
              {agenciesState.error ? (
                <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-sm text-destructive">
                  {agenciesState.error}
                </div>
              ) : agencies.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {agencies.map((agency) => (
                    <AgencyCard key={agency.id} agency={agency} />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-10 text-center">
                  <h2 className="text-lg font-semibold">No agencies found</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Add an agency to start managing interns and attendance data.
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
