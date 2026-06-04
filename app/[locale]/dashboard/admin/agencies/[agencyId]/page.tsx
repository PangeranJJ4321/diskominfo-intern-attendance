"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Navbar } from "@/components/custom/navbar";
import RuleEditor from "./components/rule-editor";
import ScheduleEditor from "./components/schedule-editor";
import AreaEditor from "./components/area-editor";
import AgencyAccessEditor from "./components/agency-access-editor";
import { InternAttendances } from "./components/intern-attendances";

interface AgencyRule {
  id: string;
  requireFaceVerification: boolean;
  requireWithinArea: boolean;
  lateToleranceMinutes: number;
}

interface Agency {
  id: string;
  name: string;
  rule: AgencyRule;
}

export default function AgencyPage({
  params,
}: {
  params: Promise<{ agencyId: string }>;
}) {
  const router = useRouter();
  const { data: session } = useSession();

  const [agencyId, setAgencyId] = useState<string>("");
  const [agency, setAgency] = useState<Agency | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentUserId = session?.user?.id || null;

  // Extract agencyId from params
  useEffect(() => {
    const extractParams = async () => {
      const resolvedParams = await params;
      setAgencyId(resolvedParams.agencyId);
    };
    extractParams();
  }, [params]);

  // Fetch agency data from API
  useEffect(() => {
    if (!agencyId) return;

    const fetchAgency = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/agencies/${agencyId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            setError("not-found");
            return;
          }
          throw new Error("Failed to fetch agency data");
        }

        const data = await response.json();
        setAgency(data);
        setError(null);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchAgency();
  }, [agencyId]);

  if (error === "not-found") {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900">404</h1>
          <p className="text-gray-600 mt-2">Agency not found</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-screen">
      <Navbar>
        <div className="p-3">
          {loading ? (
            <>
              <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-64 bg-gray-200 rounded mt-2 animate-pulse" />
            </>
          ) : agency ? (
            <div className="ml-3">
              <h1 className="text-2xl font-bold">{agency.name}</h1>
              <p className="text-gray-600">Manage agency settings and rules</p>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-red-600">Error</h1>
              <p className="text-gray-600">
                {error || "Failed to load agency"}
              </p>
            </>
          )}
        </div>
      </Navbar>
      <main className="flex-1 overflow-auto">
        {loading ? (
          <div className="space-y-4 p-6">
            <div className="h-64 bg-gray-100 rounded animate-pulse" />
          </div>
        ) : agency ? (
          <div className="space-y-4 p-6">
            <AreaEditor />
            <ScheduleEditor />
            <RuleEditor agencyId={agencyId} initialRule={agency.rule} />
            <InternAttendances agencyId={agencyId} />
            <AgencyAccessEditor
              agencyId={agencyId}
              currentUserId={currentUserId}
            />
          </div>
        ) : null}
      </main>
    </div>
  );
}
