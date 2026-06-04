/**
 * Auth Layout — Server Component Guard
 *
 * Redirects already-authenticated users away from /auth/sign-in and
 * /auth/sign-up so they cannot reach the login forms once signed in.
 * Redirects to role-based dashboard based on user role.
 */
import { redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { getDashboardUrl } from "@/lib/dal";
import { headers } from "next/headers";

export default async function AuthLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    const dashboardUrl = await getDashboardUrl(session.user.id);
    redirect({ href: dashboardUrl, locale });
  }

  return <>{children}</>;
}
