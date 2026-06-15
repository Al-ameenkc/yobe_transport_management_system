import { createClient, createServiceClient } from "@/lib/supabase/server";
import { unwrapRelation } from "@/lib/supabase/helpers";
import { isYobeLGA, getYobeLGAs } from "@/lib/constants/lgas";
import {
  YOBE_ORIGIN,
  YOBE_DESTINATIONS,
  todayDateString,
  isYobeDestination,
  isVehicleAllowedForDestination,
  type TripScope,
  type RouteScope,
} from "@/lib/constants/routes";
import { getVehicleConfig, normalizeVehicleType } from "@/lib/constants/vehicles";
import { enrichSchedulesWithDrivingMetrics, enrichScheduleWithDrivingMetrics } from "@/lib/maps/route-distance";
import type { Bus, Route, ScheduleWithDetails, Seat, SeatLayout } from "@/types/database";

function normalizeSchedule(raw: Record<string, unknown>): ScheduleWithDetails | null {
  const route = unwrapRelation(raw.route as ScheduleWithDetails["route"]);
  const bus = unwrapRelation(raw.bus as ScheduleWithDetails["bus"]);
  const company = unwrapRelation(route?.company);

  if (!route || !bus || !company) return null;

  return {
    ...(raw as Omit<ScheduleWithDetails, "route" | "bus">),
    route: { ...route, company },
    bus,
  };
}

function getRouteScope(route: Route): RouteScope {
  if (route.route_scope) return route.route_scope;
  if (isYobeLGA(route.origin) && isYobeLGA(route.destination)) return "within_yobe";
  return "outside_yobe";
}

function getBusVehicleType(bus: Bus) {
  const layout = bus.seat_layout as SeatLayout;
  return normalizeVehicleType(
    layout?.vehicleType ?? bus.vehicle_type ?? bus.model
  );
}

async function ensureScheduleSeats(scheduleId: string, bus: Bus): Promise<Seat[]> {
  const supabase = await createClient();
  const vehicleType = getBusVehicleType(bus);
  const expected = getVehicleConfig(vehicleType).seatNumbers;

  const { data: current } = await supabase
    .from("seats")
    .select("*")
    .eq("schedule_id", scheduleId);

  const seatList = (current ?? []) as Seat[];
  const existing = new Set(seatList.map((s) => s.seat_number));
  const matchesLayout =
    seatList.length === expected.length &&
    expected.every((n) => existing.has(n));

  if (matchesLayout) {
    return seatList.sort(
      (a, b) => expected.indexOf(a.seat_number) - expected.indexOf(b.seat_number)
    );
  }

  const hasBooked = seatList.some((s) => s.status === "booked");
  if (hasBooked) return seatList;

  const service = await createServiceClient();
  await service.from("seats").delete().eq("schedule_id", scheduleId);
  await service.from("seats").insert(
    expected.map((seat_number) => ({ schedule_id: scheduleId, seat_number }))
  );

  const { data: refreshed } = await supabase
    .from("seats")
    .select("*")
    .eq("schedule_id", scheduleId);

  return ((refreshed ?? []) as Seat[]).sort(
    (a, b) => expected.indexOf(a.seat_number) - expected.indexOf(b.seat_number)
  );
}

function matchesScheduleFilters(
  schedule: ScheduleWithDetails,
  options: {
    scope?: TripScope;
    origin?: string;
    destination?: string;
    vehicleType?: string;
  }
) {
  const routeScope = getRouteScope(schedule.route);
  const origin = options.origin?.trim();
  const destination = options.destination?.trim();
  const vehicleType = options.vehicleType?.trim();

  if (options.scope === "within") {
    if (routeScope !== "within_yobe") return false;
    if (!isYobeLGA(schedule.route.origin) || !isYobeLGA(schedule.route.destination)) {
      return false;
    }
    if (origin && schedule.route.origin.toLowerCase() !== origin.toLowerCase()) return false;
    if (
      destination &&
      schedule.route.destination.toLowerCase() !== destination.toLowerCase()
    ) {
      return false;
    }
  } else if (options.scope === "outside") {
    if (routeScope !== "outside_yobe") return false;
    if (schedule.route.origin.toLowerCase() !== YOBE_ORIGIN.toLowerCase()) return false;
    if (
      destination &&
      schedule.route.destination.toLowerCase() !== destination.toLowerCase()
    ) {
      return false;
    }
    if (!isYobeDestination(schedule.route.destination)) return false;

    const busType = normalizeVehicleType(
      schedule.bus.vehicle_type ??
        (schedule.bus.seat_layout as { vehicleType?: string })?.vehicleType ??
        schedule.bus.model
    );
    if (!isVehicleAllowedForDestination(schedule.route.destination, busType)) {
      return false;
    }
  } else {
    if (routeScope === "within_yobe") {
      if (!isYobeLGA(schedule.route.origin) || !isYobeLGA(schedule.route.destination)) {
        return false;
      }
    } else {
      if (schedule.route.origin.toLowerCase() !== YOBE_ORIGIN.toLowerCase()) return false;
      if (!isYobeDestination(schedule.route.destination)) return false;
    }
  }

  if (vehicleType) {
    const busType = normalizeVehicleType(
      schedule.bus.vehicle_type ??
        (schedule.bus.seat_layout as { vehicleType?: string })?.vehicleType ??
        schedule.bus.model
    );
    if (busType !== normalizeVehicleType(vehicleType)) return false;
  }

  return true;
}

export async function getAvailableSchedules(options?: {
  scope?: TripScope;
  origin?: string;
  destination?: string;
  date?: string;
  vehicleType?: string;
}) {
  const supabase = await createClient();
  const date = options?.date ?? todayDateString();

  const startOfDay = `${date}T00:00:00`;
  const endOfDay = `${date}T23:59:59.999`;

  const { data, error } = await supabase
    .from("schedules")
    .select(
      `
      *,
      route:routes(*, company:companies(*)),
      bus:buses(*)
    `
    )
    .eq("status", "scheduled")
    .gte("departure_at", startOfDay)
    .lte("departure_at", endOfDay)
    .order("departure_at", { ascending: true });

  if (error) throw error;

  const normalized = (data ?? [])
    .map((row) => normalizeSchedule(row as Record<string, unknown>))
    .filter((s): s is ScheduleWithDetails => {
      if (!s) return false;
      return matchesScheduleFilters(s, options ?? {});
    });

  const withSeats = await Promise.all(
    normalized.map(async (schedule) => {
      const seatList = await ensureScheduleSeats(schedule.id, schedule.bus);
      const availableSeats = seatList.filter((s) => s.status === "available").length;
      const busVehicleType = getBusVehicleType(schedule.bus);

      return {
        ...schedule,
        seats: seatList,
        available_seats: availableSeats,
        total_seats: getVehicleConfig(busVehicleType).capacity,
      };
    })
  );

  return enrichSchedulesWithDrivingMetrics(withSeats);
}

export async function searchSchedules(
  origin: string,
  destination: string,
  date: string
) {
  return getAvailableSchedules({ destination, date, origin });
}

export async function getScheduleById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("schedules")
    .select(
      `
      *,
      route:routes(*, company:companies(*)),
      bus:buses(*)
    `
    )
    .eq("id", id)
    .single();

  if (error) throw error;

  const schedule = normalizeSchedule(data as Record<string, unknown>);
  if (!schedule) throw new Error("Schedule not found");
  return enrichScheduleWithDrivingMetrics(schedule);
}

export async function getScheduleSeats(scheduleId: string) {
  const schedule = await getScheduleById(scheduleId);
  return ensureScheduleSeats(scheduleId, schedule.bus);
}

export function getScheduleFare(schedule: ScheduleWithDetails) {
  return schedule.fare_override ?? schedule.route.base_fare;
}

export function getYobeDestinations() {
  return [...YOBE_DESTINATIONS];
}

export function getYobeLGAsList() {
  return getYobeLGAs();
}

export function getYobeOrigin() {
  return YOBE_ORIGIN;
}

export async function getOriginsAndDestinations() {
  return {
    origins: [YOBE_ORIGIN],
    destinations: getYobeDestinations(),
    lgas: getYobeLGAs(),
  };
}
