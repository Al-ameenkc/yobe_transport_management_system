import { notFound } from "next/navigation";
import Link from "next/link";
import { TripBookingClient } from "@/components/booking/trip-booking-client";
import { TripRouteBanner } from "@/components/booking/trip-route-banner";
import { getCurrentUser } from "@/lib/auth/actions";
import {
  getScheduleById,
  getScheduleSeats,
  getScheduleFare,
} from "@/lib/booking/queries";
import { isYobeLGA } from "@/lib/constants/lgas";
import { displayBoardingTown } from "@/lib/constants/routes";
import { getVehicleLabel, normalizeVehicleType } from "@/lib/constants/vehicles";
import type { SeatLayout } from "@/types/database";

interface TripPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}

export default async function TripPage({ params, searchParams }: TripPageProps) {
  const { id } = await params;
  const { from } = await searchParams;
  const session = await getCurrentUser().catch(() => null);

  let schedule;
  let seats;

  try {
    schedule = await getScheduleById(id);
    seats = await getScheduleSeats(id);
  } catch {
    notFound();
  }

  const fare = getScheduleFare(schedule);
  const layout = schedule.bus.seat_layout as SeatLayout;
  const vehicleType = normalizeVehicleType(
    layout.vehicleType ?? schedule.bus.vehicle_type ?? schedule.bus.model
  );
  const origin = displayBoardingTown(schedule.route.origin, from);
  const isWithin =
    schedule.route.route_scope === "within_yobe" ||
    (isYobeLGA(origin) && isYobeLGA(schedule.route.destination));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link href="/search" className="text-sm text-emerald-600 hover:underline">
        ← Back to search
      </Link>

      <div className="mt-4">
        <TripRouteBanner
          layout="page"
          origin={origin}
          destination={schedule.route.destination}
          isWithin={isWithin}
          distanceKm={Number(schedule.route.distance_km)}
          driveDurationMinutes={schedule.route.driving_duration_minutes}
          departureAt={schedule.departure_at}
          arrivalAt={schedule.arrival_at}
          companyName={schedule.route.company.name}
          fare={fare}
          plateNumber={schedule.bus.plate_number}
          vehicleLabel={getVehicleLabel(vehicleType)}
        />
      </div>

      <TripBookingClient
        schedule={schedule}
        seats={seats}
        fare={fare}
        userId={session?.user?.id ?? ""}
      />
    </div>
  );
}
