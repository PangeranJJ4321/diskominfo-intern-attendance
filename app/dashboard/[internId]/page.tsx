"use client";

import { use, useEffect, useState, useMemo, useRef } from "react";
import { useSession } from "@/lib/auth-client";
import { Navbar } from "@/components/custom/navbar";
import { Skeleton } from "@/components/ui/skeleton";
import type { GeoJsonObject } from "geojson";
import { getAttendanceAreas } from "@/lib/services/attendance-areas";
import { createLocationLog } from "@/lib/services/location-logs";
import { useLocationStore } from "@/stores/location-store";
import { useInternStore } from "@/stores/intern-store";
import { useAgencyStore } from "@/stores/agency-store";
import type { AgencyRule } from "@/interfaces/models";

// Import subcomponents
import TakeAttendanceList from "./components/take-attendance-list";
import LiveLocationMapCard from "./components/live-location-map-card";
import AttendanceHistoriesCard from "./components/attendance-histories-card";
import { InternInfoCard } from "@/components/custom/intern-info-card";

// Default geofence centered on User's coordinates
const DEFAULT_GEOFENCE: GeoJsonObject = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [119.502034, -5.146476],
            [119.512034, -5.146476],
            [119.512034, -5.136476],
            [119.502034, -5.136476],
            [119.502034, -5.146476],
          ],
        ],
      },
    },
  ],
} as unknown as GeoJsonObject;

/**
 * Renders the dashboard page for a specific intern, with attendance and location logging.
 *
 * @param {{ params: Promise<{ internId: string }> }} props - The route parameters containing the intern ID.
 * @returns {React.JSX.Element} The rendered dashboard page.
 */
export default function InternDashboardPage({
  params,
}: {
  params: Promise<{ internId: string }>;
}) {
  const { internId } = use(params);
  const { data: session, isPending } = useSession();

  // Geolocation state from Zustand store (updated by LiveLocationMap)
  const currentLocation = useLocationStore((s) => s.currentLocation);
  const setGeofence = useLocationStore((s) => s.setGeofence);

  // Intern & Agency stores
  const fetchInterns = useInternStore((s) => s.fetchInterns);
  const getInternForUser = useInternStore((s) => s.getInternForUser);
  const fetchAgencyRule = useAgencyStore((s) => s.fetchAgencyRule);

  const geofenceFetchStatus = useRef({ initiated: false, completed: false });
  const [hasLoggedLocation, setHasLoggedLocation] = useState(false);
  const [agencyRule, setAgencyRule] = useState<AgencyRule | null>(null);

  // Resolve user info from session
  const user = useMemo(() => {
    if (!session?.user) {
      return null;
    }

    return {
      id: session.user.id,
      name: session.user.name ?? "User",
    };
  }, [session]);

  // Automatically log location once GPS resolves
  useEffect(() => {
    if (user?.id && currentLocation && !hasLoggedLocation) {
      setTimeout(() => {
        setHasLoggedLocation(true);
      }, 0);
      createLocationLog({
        userId: user.id,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      }).catch((err) => {
        console.error("Gagal mengirim log lokasi otomatis:", err);
      });
    }
  }, [currentLocation, user?.id, hasLoggedLocation]);

  // Load agency rule for the intern
  useEffect(() => {
    if (!user?.id) return;

    async function loadAgencyRule() {
      try {
        await fetchInterns();
        const intern = getInternForUser(user?.id ?? "");
        if (intern) {
          const rule = await fetchAgencyRule(intern.agencyId);
          if (rule) setAgencyRule(rule);
        }
      } catch (err) {
        console.error("Gagal memuat aturan instansi:", err);
      }
    }

    void loadAgencyRule();
  }, [internId, user?.id, fetchInterns, getInternForUser, fetchAgencyRule]);

  // Load geofence from the backend
  useEffect(() => {
    // If a fetch has already started or finished, block any duplicate calls entirely
    if (geofenceFetchStatus.current.initiated) return;

    async function loadGeofence() {
      // Lock it immediately before the async call starts
      geofenceFetchStatus.current.initiated = true;

      try {
        const areas = await getAttendanceAreas();

        if (areas.length > 0 && areas[0].geoData) {
          setGeofence(areas[0].geoData as GeoJsonObject);
        } else if (currentLocation) {
          const lat = currentLocation.latitude;
          const lng = currentLocation.longitude;
          setGeofence({
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                properties: {},
                geometry: {
                  type: "Polygon",
                  coordinates: [
                    [
                      [lng - 0.003, lat - 0.003],
                      [lng + 0.003, lat - 0.003],
                      [lng + 0.003, lat + 0.003],
                      [lng - 0.003, lat + 0.003],
                      [lng - 0.003, lat - 0.003],
                    ],
                  ],
                },
              },
            ],
          } as unknown as GeoJsonObject);
        } else {
          setGeofence(DEFAULT_GEOFENCE);
        }
        geofenceFetchStatus.current.completed = true;
      } catch (err) {
        console.error("Gagal memuat area presensi:", err);
        setGeofence(DEFAULT_GEOFENCE);
      }
    }

    // Only execute if we don't have data yet
    if (!geofenceFetchStatus.current.completed) {
      void loadGeofence();
    }
  }, [currentLocation, setGeofence]);

  return (
    <>
      <Navbar />
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6 animate-in fade-in duration-300">
        {/* Header Section */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
            Dashboard Presensi
          </h1>
          <div className="text-muted-foreground text-xs md:text-sm">
            Selamat datang kembali,{" "}
            {isPending || !user ? (
              <Skeleton className="inline-block h-4 w-24 align-middle" />
            ) : (
              <span className="font-bold text-primary">{user.name}</span>
            )}
            . Kelola dan pantau catatan presensi Anda di bawah ini.
          </div>
        </div>
        {isPending || !user ? (
          <>
            <Skeleton className="w-full h-48" />
            <Skeleton className="w-full h-48" />
            <Skeleton className="w-full h-48" />
          </>
        ) : (
          <>
            <div className="flex flex-col gap-6">
              <TakeAttendanceList
                userId={user.id}
                userName={user.name}
                agencyRule={agencyRule}
              />

              <LiveLocationMapCard agencyRule={agencyRule} />
            </div>

            <div className="pt-2">
              <AttendanceHistoriesCard userId={user.id} />
            </div>
            <InternInfoCard userId={user.id} />
          </>
        )}
      </main>
    </>
  );
}
