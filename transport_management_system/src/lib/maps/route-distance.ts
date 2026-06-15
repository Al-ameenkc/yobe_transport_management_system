import { cache } from "react";
import { getLocationCoordinates } from "@/lib/constants/locations";

export interface DrivingMetrics {
  distanceKm: number;
  durationMinutes: number;
}

const metricsCache = new Map<string, DrivingMetrics>();

function routeKey(origin: string, destination: string) {
  return `${origin.trim().toLowerCase()}|${destination.trim().toLowerCase()}`;
}

function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

async function fetchOsrmMetrics(
  origin: string,
  destination: string
): Promise<DrivingMetrics | null> {
  const from = getLocationCoordinates(origin);
  const to = getLocationCoordinates(destination);
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=false`;

  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) return null;

  const data = await res.json();
  const route = data?.routes?.[0];
  if (!route?.distance) return null;

  return {
    distanceKm: Math.round(route.distance / 1000),
    durationMinutes: Math.max(1, Math.round(route.duration / 60)),
  };
}

function fallbackMetrics(origin: string, destination: string, fallbackKm?: number): DrivingMetrics {
  const from = getLocationCoordinates(origin);
  const to = getLocationCoordinates(destination);
  const km = Math.round(fallbackKm ?? haversineKm(from, to));
  return {
    distanceKm: km,
    durationMinutes: Math.max(1, Math.round((km / 55) * 60)),
  };
}

/** Real road distance & drive time from OSRM (cached per origin–destination pair). */
export const getDrivingMetrics = cache(
  async (origin: string, destination: string, fallbackKm?: number): Promise<DrivingMetrics> => {
    const key = routeKey(origin, destination);
    const cached = metricsCache.get(key);
    if (cached) return cached;

    const osrm = await fetchOsrmMetrics(origin, destination).catch(() => null);
    const result = osrm ?? fallbackMetrics(origin, destination, fallbackKm);
    metricsCache.set(key, result);
    return result;
  }
);

type RoutableSchedule = {
  route: {
    origin: string;
    destination: string;
    distance_km: number;
    driving_duration_minutes?: number;
  };
};

export async function enrichSchedulesWithDrivingMetrics<T extends RoutableSchedule>(
  schedules: T[]
): Promise<T[]> {
  if (schedules.length === 0) return schedules;

  const pairs = new Map<string, { origin: string; destination: string; fallback: number }>();
  for (const s of schedules) {
    const key = routeKey(s.route.origin, s.route.destination);
    if (!pairs.has(key)) {
      pairs.set(key, {
        origin: s.route.origin,
        destination: s.route.destination,
        fallback: Number(s.route.distance_km),
      });
    }
  }

  const metricsMap = new Map<string, DrivingMetrics>();
  await Promise.all(
    [...pairs.entries()].map(async ([key, { origin, destination, fallback }]) => {
      metricsMap.set(key, await getDrivingMetrics(origin, destination, fallback));
    })
  );

  return schedules.map((s) => {
    const key = routeKey(s.route.origin, s.route.destination);
    const m = metricsMap.get(key)!;
    return {
      ...s,
      route: {
        ...s.route,
        distance_km: m.distanceKm,
        driving_duration_minutes: m.durationMinutes,
      },
    };
  });
}

export async function enrichScheduleWithDrivingMetrics<T extends RoutableSchedule>(
  schedule: T
): Promise<T> {
  const [enriched] = await enrichSchedulesWithDrivingMetrics([schedule]);
  return enriched;
}

export function formatDriveDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
