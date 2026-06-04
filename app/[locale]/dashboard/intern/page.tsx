import { redirect } from "next/navigation";
import AttendanceMap from "./components/attendance-map";
import { AgencyCard } from "./components/agency-card";
import { AttendanceHistoryCard } from "./components/attendance-history-card";
import { ScheduleList } from "./components/schedule-list";
import { LocationProvider } from "./context/location-context";
import { AttendanceProvider } from "./context/attendance-context";
import { headers } from "next/headers";
import { requireAuth } from "@/lib/dal";

function getBaseUrl(requestHeaders: Headers) {
  const origin = requestHeaders.get("origin");
  if (origin) return origin;

  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  if (!host) return "http://localhost:3000";

  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  return `${protocol}://${host}`;
}

async function fetchAPI(path: string) {
  const requestHeaders = await headers();
  const url = `${getBaseUrl(requestHeaders)}${path}`;

  const res = await fetch(url, {
    cache: "no-store",
    headers: { cookie: requestHeaders.get("cookie") ?? "" },
  });

  if (!res.ok) return null;
  return res.json();
}

export default async function InternDashboardPage() {
  const session = await requireAuth();

  const internsRes = await fetchAPI(
    `/api/interns?userId=${session.user.id}&limit=1`,
  );

  const intern = internsRes?.data?.[0] ?? null;

  // Redirect if the user is not registered as an intern
  if (!intern) {
    redirect(`/user/${session.user.id}`);
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4">
      <LocationProvider>
        <AttendanceProvider>
          <ScheduleList intern={intern} />
          <AttendanceMap agencyId={intern.agencyId} />
          <AttendanceHistoryCard intern={intern} />
          <AgencyCard intern={intern} />
        </AttendanceProvider>
      </LocationProvider>
    </main>
  );
}
