"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Navigation, Info, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLocationStore } from "@/stores/location-store";
import type { AgencyRule } from "@/interfaces/models";

const LiveLocationMap = dynamic(() => import("./live-location-map"), {
  ssr: false,
  loading: () => <Skeleton className="h-90 w-full rounded-2xl" />,
});

/**
 * Props for the LiveLocationMapCard component.
 * Location and geofence state are read from the Zustand store,
 * but agency rule is passed in to control geofence enforcement display.
 */
interface LiveLocationMapCardProps {
  /** Agency rule to control whether geofence warnings are shown */
  agencyRule: AgencyRule | null;
}

/**
 * Card component containing the live location map and geofence status.
 * Reads location state from the Zustand store instead of receiving props,
 * but accepts agencyRule to control geofence enforcement UI.
 */
export default function LiveLocationMapCard({
  agencyRule,
}: LiveLocationMapCardProps) {
  const isWithinGeofence = useLocationStore((s) => s.isWithinGeofence);
  const enforceGeo = agencyRule?.requireWithinArea !== false;
  return (
    <Card className="w-full overflow-hidden transition-all duration-300 hover:shadow-md border border-border/60 bg-card/45 backdrop-blur-md">
      <CardHeader className="flex flex-row items-center justify-between pb-4 space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <MapPin className="size-5 text-primary animate-pulse" />
            Area & Lokasi Anda
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Verifikasi wilayah presensi Anda secara real-time.
          </p>
        </div>
        <div>
          {isWithinGeofence === null ? (
            <Badge
              variant="outline"
              className="animate-pulse bg-muted text-muted-foreground gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold"
            >
              <Navigation className="size-3" />
              Mencari Sinyal GPS
            </Badge>
          ) : isWithinGeofence ? (
            <Badge className="bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400 gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Di Dalam Area
            </Badge>
          ) : enforceGeo ? (
            <Badge className="bg-destructive/10 border-destructive/25 text-destructive gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold">
              <AlertTriangle className="size-3" />
              Di Luar Area
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold"
            >
              <Navigation className="size-3" />
              Wajib Area Dinonaktifkan
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Map Container */}
        <LiveLocationMap />

        {enforceGeo && isWithinGeofence === false && (
          <div className="flex items-start gap-2 text-xs bg-destructive/5 border border-destructive/10 rounded-xl p-3 text-destructive">
            <Info className="size-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed font-medium">
              Presensi hanya dapat dikirim jika Anda berada di dalam area
              kantor. Silakan mendekat ke area.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
