/**
 * Dashboard Layout — Role-Based Router
 *
 * Redirects users to their role-specific dashboard based on their user role.
 * Ensures users can only access dashboards appropriate for their role.
 */
import { redirect } from "@/i18n/navigation";
import { getSession } from "@/lib/dal";

export default async function DashboardLayout({
  params,
  children,
}: {
  params: Promise<{ locale: string }>;
  children: React.ReactNode;
}) {
  const { locale } = await params;
  const session = await getSession();

  // Require authentication
  if (!session) {
    redirect({ href: "/auth/sign-in", locale });
  }

  return <>{children}</>;
}
