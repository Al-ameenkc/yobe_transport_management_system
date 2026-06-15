import { LGA_COORDINATES, isYobeLGA, type YobeLGA } from "@/lib/constants/lgas";
import { YOBE_ORIGIN, YOBE_DESTINATIONS } from "@/lib/constants/routes";

export type TripScope = "within" | "outside";

export const STATE_COORDINATES: Record<string, { lat: number; lng: number }> = {
  Yobe: { lat: 12.0, lng: 11.7 },
  Abuja: { lat: 9.08, lng: 7.53 },
  Jos: { lat: 9.9, lng: 8.86 },
  Bauchi: { lat: 10.32, lng: 9.84 },
  Kano: { lat: 12.0, lng: 8.59 },
  Kaduna: { lat: 10.51, lng: 7.42 },
  Nasarawa: { lat: 8.54, lng: 8.32 },
  Niger: { lat: 9.6, lng: 6.55 },
  Sokoto: { lat: 13.01, lng: 5.25 },
  Zamfara: { lat: 12.17, lng: 6.66 },
};

export const NIGERIA_BOUNDS = {
  minLat: 4.0,
  maxLat: 13.9,
  minLng: 2.7,
  maxLng: 14.7,
};

export const YOBE_BOUNDS = {
  minLat: 11.2,
  maxLat: 13.5,
  minLng: 10.3,
  maxLng: 12.1,
};

export function getLocationCoordinates(name: string) {
  if (isYobeLGA(name)) {
    return LGA_COORDINATES[name as YobeLGA];
  }
  if (STATE_COORDINATES[name]) {
    return STATE_COORDINATES[name];
  }
  return STATE_COORDINATES[YOBE_ORIGIN];
}

export function inferTripScope(origin: string, destination: string): TripScope {
  if (isYobeLGA(origin) && isYobeLGA(destination)) return "within";
  return "outside";
}

export function getMapBounds(origin: string, destination: string) {
  const scope = inferTripScope(origin, destination);
  return scope === "within" ? YOBE_BOUNDS : NIGERIA_BOUNDS;
}

export function projectToMap(
  lat: number,
  lng: number,
  bounds: typeof NIGERIA_BOUNDS,
  width = 200,
  height = 160
) {
  const pad = 16;
  const w = width - pad * 2;
  const h = height - pad * 2;
  const x = pad + ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * w;
  const y = pad + ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * h;
  return { x, y };
}

export { YOBE_DESTINATIONS };
