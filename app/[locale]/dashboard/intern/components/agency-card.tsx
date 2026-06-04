import { headers } from "next/headers";
import { z } from "zod";
import {
  ArrowRight,
  Building2,
  Calendar,
  Camera,
  Clock,
  Map as MapIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/reui/badge";
import { Separator } from "@/components/ui/separator";
import { agencySchema } from "@/lib/schemas/agency";
import { agencyRuleSchema } from "@/lib/schemas/agency-rule";
import { internSchema } from "@/lib/schemas/intern";

type Intern = z.infer<typeof internSchema> | null;

// Helper to resolve the correct internal URL for API calls in Server Components
function getBaseUrl(requestHeaders: Headers) {
  const origin = requestHeaders.get("origin");
  if (origin) return origin;

  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  if (!host) return "http://localhost:3000";

  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  return `${protocol}://${host}`;
}

// Reusable fetcher that passes the session cookie forward
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

export async function AgencyCard({ intern }: { intern: Intern }) {
  if (!intern) {
    return (
      <Card className="w-full transition-all hover:shadow-md">
        <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-4">
          <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Building2 className="size-6" />
          </div>
          <div className="flex-1 space-y-1">
            <CardTitle className="text-xl">No internship found</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            You are not registered as an intern.
          </p>
        </CardContent>
      </Card>
    );
  }

  // 2. Resolve agencyId flexibly (supports either flat or nested relation)
  const agencyId = intern.agencyId;

  // 3. Fetch parallel requirements via API when agencyId is available
  const [agencyRaw, ruleRaw] = agencyId
    ? await Promise.all([
        fetchAPI(`/api/agencies/${agencyId}`),
        fetchAPI(`/api/agency-rules/${agencyId}`),
      ])
    : [null, null];

  const agency = agencyRaw ? agencySchema.safeParse(agencyRaw) : null;
  const rule = ruleRaw ? agencyRuleSchema.safeParse(ruleRaw) : null;

  const agencyName = agency?.success ? agency.data.name : "Unknown Agency";

  const internship = {
    startDate: intern.startedAt
      ? new Date(intern.startedAt).toLocaleDateString(undefined, {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "-",
    finishDate: intern.finishedAt
      ? new Date(intern.finishedAt).toLocaleDateString(undefined, {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "Ongoing",
  };

  const activeRule =
    rule && "success" in rule && rule.success
      ? rule.data
      : {
          requireFaceVerification: true,
          requireWithinArea: true,
          lateToleranceMinutes: 15,
        };

  return (
    <Card className="w-full transition-all hover:shadow-md">
      <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-4">
        <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Building2 className="size-6" />
        </div>
        <div className="flex-1 space-y-1">
          <CardTitle className="text-xl">{agencyName}</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex items-center justify-between rounded-lg border bg-muted/10 p-4">
          <div className="space-y-1">
            <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <Calendar className="size-3.5" />
              Start Date
            </span>
            <p className="text-sm font-semibold sm:text-base">
              {internship.startDate}
            </p>
          </div>

          <ArrowRight className="size-5 text-muted-foreground/50" />

          <div className="space-y-1 text-right">
            <span className="flex items-center justify-end gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Finish Date
              <Calendar className="size-3.5" />
            </span>
            <p className="text-sm font-semibold sm:text-base">
              {internship.finishDate}
            </p>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Attendance Rules
          </h4>
          <div className="space-y-2">
            {activeRule.requireFaceVerification ? (
              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-2.5 text-sm">
                <div className="flex items-center gap-2">
                  <Camera className="size-4 text-muted-foreground" />
                  <span>Face Verification</span>
                </div>
                <Badge variant="default">Required</Badge>
              </div>
            ) : null}

            {activeRule.requireWithinArea ? (
              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-2.5 text-sm">
                <div className="flex items-center gap-2">
                  <MapIcon className="size-4 text-muted-foreground" />
                  <span>Location Area</span>
                </div>
                <Badge variant="default">Required</Badge>
              </div>
            ) : null}
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-2.5 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-muted-foreground" />
                <span>Late Tolerance</span>
              </div>
              <span className="font-medium">
                {activeRule.lateToleranceMinutes > 0
                  ? `${activeRule.lateToleranceMinutes} mins`
                  : "0 mins (Strict)"}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
