"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import type { GeoJsonObject } from "geojson";
import { getInterns } from "@/lib/services/interns";
import { getAttendanceAreas } from "@/lib/services/attendance-areas";
import { createLocationLog } from "@/lib/services/location-logs";
import { Navbar } from "@/components/custom/navbar";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocationStore } from "@/stores/location-store";

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
 * Dashboard landing page — redirects to the intern's specific dashboard
 * based on their intern ID. If intern data is available, renders the full
 * dashboard UI directly.
 *
 * @returns {React.JSX.Element} A loading skeleton or the dashboard.
 */
export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Location state from Zustand store (shared across components)
  const currentLocation = useLocationStore((s) => s.currentLocation);
  const setGeofence = useLocationStore((s) => s.setGeofence);

  // Page-local state
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

  // Resolve intern data and redirect if needed
  useEffect(() => {
    if (sessionPending) return;

    async function redirectToInternDashboard() {
      try {
        const interns = await getInterns();
        const intern = interns.find((i) => i.userId === session?.user?.id);
        if (intern) {
          router.replace(`/dashboard/${intern.id}`);
          return;
        }
        // No intern data — redirect to profile
        if (session?.user?.id) {
          router.replace(`/profile/${session.user.id}`);
          return;
        }
        setError("Data pemagang tidak ditemukan. Harap lengkapi profil Anda.");
      } catch (err) {
        console.error("Failed to fetch interns:", err);
        setError("Gagal memuat data pemagang.");
      } finally {
        setLoading(false);
      }
    }

    void redirectToInternDashboard();
  }, [sessionPending, session, router]);

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
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Dashboard Presensi
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm">
            Memuat data dashboard...
          </p>
        </div>
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
            <p className="text-destructive font-medium">{error}</p>
          </div>
        ) : null}
      </main>
    </>
  );
}
