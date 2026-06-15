import type { VehicleType } from "@/lib/constants/vehicles";

export type RouteScope = "within_yobe" | "outside_yobe";
export type TripScope = "within" | "outside";

export const YOBE_ORIGIN = "Yobe";

export const YOBE_DESTINATIONS = [
  "Abuja",
  "Jos",
  "Bauchi",
  "Kano",
  "Kaduna",
  "Nasarawa",
  "Niger",
  "Sokoto",
  "Zamfara",
] as const;

export type YobeDestination = (typeof YOBE_DESTINATIONS)[number];

export function isYobeDestination(value: string): value is YobeDestination {
  return (YOBE_DESTINATIONS as readonly string[]).includes(value);
}

export function todayDateString() {
  return new Date().toISOString().split("T")[0];
}

/** Routes where only certain vehicle types are permitted */
export const DESTINATION_VEHICLE_RULES: Partial<
  Record<YobeDestination, { allowed: VehicleType[] }>
> = {
  Abuja: { allowed: ["bus", "sienna"] },
};

export function isVehicleAllowedForDestination(
  destination: string,
  vehicleType: VehicleType
): boolean {
  const rule = DESTINATION_VEHICLE_RULES[destination as YobeDestination];
  if (!rule) return true;
  return rule.allowed.includes(vehicleType);
}

export function getAllowedVehiclesForDestination(destination: string): VehicleType[] | null {
  const rule = DESTINATION_VEHICLE_RULES[destination as YobeDestination];
  return rule?.allowed ?? null;
}

export function tripScopeToRouteScope(scope: TripScope): RouteScope {
  return scope === "within" ? "within_yobe" : "outside_yobe";
}
