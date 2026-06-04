import { redirect } from "@/i18n/navigation";
import { getSession, getDashboardUrl } from "@/lib/dal";

export default async function DashboardIndex({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = await params;
  const session = await getSession();

  if (!session) {
    redirect({ href: "/auth/sign-in", locale });
  }

  const path = await getDashboardUrl(session!.user.id);

  // Build a locale-prefixed absolute path to avoid unexpected path composition
  redirect({ href: `/${path}`, locale });
}
