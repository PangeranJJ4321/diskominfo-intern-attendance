import { headers } from "next/headers";
import { ScheduleCard } from "./schedule-card";
import { agencyScheduleSchema } from "@/lib/schemas/agency-schedule";
import { internSchema } from "@/lib/schemas/intern";
import { z } from "zod";

type Intern = z.infer<typeof internSchema> | null;

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

  try {
    const res = await fetch(url, {
      cache: "no-store",
      headers: { cookie: requestHeaders.get("cookie") ?? "" },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error(`Failed to fetch ${path}:`, error);
    return null;
  }
}

export async function ScheduleList({ intern }: { intern: Intern }) {
  if (!intern) {
    return (
      <div className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">
          Jadwal Hari Ini
        </h2>
        <p className="text-sm text-muted-foreground">
          Anda belum terdaftar sebagai peserta magang.
        </p>
      </div>
    );
  }

  // Fetch the agency's timezone so dayOfWeek is computed in local time,
  // not server UTC (which would show yesterday's schedule near midnight).
  let timezone = "Asia/Makassar";
  try {
    const areaRes = await fetchAPI(`/api/agency-areas/${intern.agencyId}`);
    if (areaRes?.timezone) {
      timezone = areaRes.timezone;
    }
  } catch {
    // Fall back to default
  }

  const today = new Date();
  // Compute today's day-of-week in the agency's local timezone
  const dayOfWeekFormatter = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: timezone,
  });
  const dayOfWeekMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const dayOfWeek =
    dayOfWeekMap[dayOfWeekFormatter.format(today)] ?? today.getDay();

  // 1. Fetch all schedules for this agency via API
  const scheduleRes = await fetchAPI(
    `/api/agency-schedules?agencyId=${intern.agencyId}`,
  );

  type AgencySchedule = z.infer<typeof agencyScheduleSchema>;

  // 2. Validate, parse, and filter the schedules to only include today's schedules
  const rawSchedules: AgencySchedule[] = (scheduleRes?.data || [])
    .map((item: unknown) => {
      const parsed = agencyScheduleSchema.safeParse(item);
      return parsed.success ? parsed.data : null;
    })
    .filter(
      (data: AgencySchedule | null): data is AgencySchedule =>
        data !== null && data.dayOfWeek === dayOfWeek,
    );

  // 3. Sort the results based on start time
  const sortedSchedules = rawSchedules.sort((a, b) =>
    a.agencyScheduleStart.localeCompare(b.agencyScheduleStart),
  );

  const count = sortedSchedules.length;

  return (
    <div className="space-y-3">
      {count === 0 ? (
        <p className="text-sm text-muted-foreground">
          Tidak ada jadwal untuk hari ini.
        </p>
      ) : count <= 2 ? (
        <div className="flex w-full gap-3 sm:gap-4">
          {sortedSchedules.map((schedule) => (
            <ScheduleCard
              key={schedule.id}
              schedule={schedule}
              internId={intern.id}
              agencyId={intern.agencyId}
              className="min-w-0 flex-1 w-full"
            />
          ))}
        </div>
      ) : (
        <div className="scrollbar-thin flex w-full snap-x snap-mandatory gap-4 overflow-x-auto p-1">
          {sortedSchedules.map((schedule) => (
            <ScheduleCard
              key={schedule.id}
              schedule={schedule}
              internId={intern.id}
              agencyId={intern.agencyId}
              className="min-w-70 shrink-0 snap-start sm:min-w-[320px]"
            />
          ))}
        </div>
      )}
    </div>
  );
}
