import { redirect } from "next/navigation";

export default async function AgencyAdminPage({
  params,
}: {
  params: Promise<{ agencyId: string }>;
}) {
  const { agencyId } = await params;
  
  // Redirect to the default active tab (users)
  redirect(`/admin/${agencyId}/users`);
}
