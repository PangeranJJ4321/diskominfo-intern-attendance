// lib/location-verifier.ts
import { getHaversineDistance } from "./haversine-formula";

interface VelocityCheckResult {
  isValid: boolean;
  distance: number;
  timeDiffSeconds: number;
  speed: number;
}

/**
 * Checks if the distance between two location logs (the new submission coordinates
 * and the user's latest logged coordinates) is physically possible in the time elapsed.
 * 
 * Returns validation outcome, distance in meters, time difference in seconds, and speed in m/s.
 *
 * @param lat1 Latitude of the newest location log
 * @param lon1 Longitude of the newest location log
 * @param time1 Created time of the newest location log
 * @param lat2 Latitude of the incoming attendance request
 * @param lon2 Longitude of the incoming attendance request
 * @param time2 Current server time/submission time
 * @param maxSpeedMps Maximum realistic speed in meters/second (default 50 m/s ~ 180 km/h)
 * @param graceDistance Minimum distance in meters allowed regardless of time (default 100 meters)
 */
export function verifyLocationVelocity(
  lat1: number,
  lon1: number,
  time1: Date,
  lat2: number,
  lon2: number,
  time2: Date,
  maxSpeedMps = 50,
  graceDistance = 100
): VelocityCheckResult {
  const distance = getHaversineDistance(lat1, lon1, lat2, lon2);
  const timeDiffMs = Math.abs(time2.getTime() - time1.getTime());
  const timeDiffSeconds = Math.max(timeDiffMs / 1000, 0.1); // Prevent division by zero
  const speed = distance / timeDiffSeconds;

  // Max allowed distance is the grace distance plus maximum travel at maxSpeed over the elapsed time
  const maxAllowedDistance = graceDistance + maxSpeedMps * timeDiffSeconds;
  const isValid = distance <= maxAllowedDistance;

  return {
    isValid,
    distance,
    timeDiffSeconds,
    speed,
  };
}
