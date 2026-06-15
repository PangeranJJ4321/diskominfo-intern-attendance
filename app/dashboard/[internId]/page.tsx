"use client";

import { use, useEffect, useState, useMemo, useRef } from "react";
import { useSession } from "@/lib/auth-client";
import { Navbar } from "@/components/custom/navbar";
import { Skeleton } from "@/components/ui/skeleton";
import type { GeoJsonObject } from "geojson";
import { getAttendanceAreas } from "@/lib/services/attendance-areas";
import { useAgencyStore } from "@/stores/useAgencyStore";
import { useInternStore } from "@/stores/useInternStore";
import { useLocationLogStore } from "@/stores/useLocationLogStore";
import { useLocationStore } from "@/stores/useLocationStore";

// Import subcomponents
import TakeAttendanceList from "./components/take-attendance-list";
import LiveLocationMapCard from "./components/live-location-map-card";
import AttendanceHistoriesCard from "./components/attendance-histories-card";
import { InternInfoCard } from "@/components/custom/intern-info-card";
import { LazyCard } from "@/components/custom/lazy-card";

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
 * Uses Zustand stores for all shared state — no prop-drilled refreshTrigger or location.
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

  // Zustand stores
  const fetchAgencyRule = useAgencyStore((s) => s.fetchAgencyRule);
  const fetchInterns = useInternStore((s) => s.fetchInterns);
  const createLog = useLocationLogStore((s) => s.createLog);
  const currentLocation = useLocationStore((s) => s.currentLocation);
  const setGeoData = useLocationStore((s) => s.setGeoData);
  const geoData = useLocationStore((s) => s.geoData);

  const geofenceFetchStatus = useRef({ initiated: false, completed: false });
  const [hasLoggedLocation, setHasLoggedLocation] = useState(false);

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

  // Automatically log location once GPS resolves and push to store
  useEffect(() => {
    if (user?.id && currentLocation && !hasLoggedLocation) {
      setTimeout(() => {
        setHasLoggedLocation(true);
      }, 0);
      createLog({
        userId: user.id,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      }).catch((err: unknown) => {
        console.error("Gagal mengirim log lokasi otomatis:", err);
      });
    }
  }, [currentLocation, user?.id, hasLoggedLocation, createLog]);

  // Pre-load agency rule into Zustand store so leaf components can read it
  useEffect(() => {
    if (!user?.id) return;

    async function loadAgencyRule() {
      try {
        await fetchInterns();
        const freshInterns = useInternStore.getState().interns;
        const intern = freshInterns.find((i) => i.id === internId);
        if (intern) {
          await fetchAgencyRule(intern.agencyId);
        }
      } catch (err) {
        console.error("Gagal memuat aturan instansi:", err);
      }
    }

    void loadAgencyRule();
  }, [internId, user?.id, fetchInterns, fetchAgencyRule]);

  // Load geofence into location store (not local state)
  useEffect(() => {
    if (geofenceFetchStatus.current.initiated) return;

    async function loadGeofence() {
      geofenceFetchStatus.current.initiated = true;

      try {
        const areas = await getAttendanceAreas();

        if (areas.length > 0 && areas[0].geoData) {
          setGeoData(areas[0].geoData as GeoJsonObject);
        } else if (currentLocation) {
          const lat = currentLocation.latitude;
          const lng = currentLocation.longitude;
          setGeoData({
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
          setGeoData(DEFAULT_GEOFENCE);
        }
        geofenceFetchStatus.current.completed = true;
      } catch (err) {
        console.error("Gagal memuat area presensi:", err);
        setGeoData(DEFAULT_GEOFENCE);
      }
    }

    if (!geofenceFetchStatus.current.completed) {
      void loadGeofence();
    }
  }, [currentLocation, setGeoData]);

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
              <LazyCard skeletonHeight="h-[220px] md:h-[180px]">
                <TakeAttendanceList internId={internId} />
              </LazyCard>

              <LazyCard skeletonHeight="h-[480px]">
                <LiveLocationMapCard geoData={geoData} />
              </LazyCard>
            </div>

            <LazyCard skeletonHeight="h-[580px]">
              <AttendanceHistoriesCard internId={internId} />
            </LazyCard>

            <LazyCard skeletonHeight="h-64">
              <InternInfoCard userId={user.id} />
            </LazyCard>
          </>
        )}
      </main>
    </>
  );
}
