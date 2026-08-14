import Link from "next/link";
import { Bus, Clock } from "lucide-react";
import { SeatMapPreview } from "@/components/booking/seat-map-preview";
import { TripRouteBanner } from "@/components/booking/trip-route-banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { isYobeLGA } from "@/lib/constants/lgas";
import { getVehicleLabel, getVehicleConfig, normalizeVehicleType } from "@/lib/constants/vehicles";
import type { ScheduleWithDetails, Seat, SeatLayout } from "@/types/database";

interface BusScheduleCardProps {
  schedule: ScheduleWithDetails;
  seats: Seat[];
  fare: number;
  boardingOrigin?: string;
}

export function BusScheduleCard({ schedule, seats, fare, boardingOrigin }: BusScheduleCardProps) {
  const layout = schedule.bus.seat_layout as SeatLayout;
  const vehicleType = normalizeVehicleType(
    layout.vehicleType ?? schedule.bus.vehicle_type ?? schedule.bus.model
  );
  const vehicleConfig = getVehicleConfig(vehicleType);
  const totalSeats = vehicleConfig.capacity;
  const layoutSeatNumbers = new Set(vehicleConfig.seatNumbers);
  const relevantSeats = seats.filter((s) => layoutSeatNumbers.has(s.seat_number));
  const seatList = relevantSeats.length > 0 ? relevantSeats : seats;
  const availableSeats = seatList.filter((s) => s.status === "available").length;
  const bookedSeats = seatList.filter((s) => s.status === "booked").length;
  const origin = boardingOrigin || schedule.route.origin;
  const isWithin =
    schedule.route.route_scope === "within_yobe" ||
    (isYobeLGA(origin) && isYobeLGA(schedule.route.destination));

  return (
    <Card className="overflow-hidden">
      <TripRouteBanner
        layout="card"
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

      <CardContent className="p-0">
        <div className="grid md:grid-cols-[1fr_auto]">
          <div className="space-y-3 p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Bus className="h-4 w-4 text-emerald-600" />
              <span className="font-semibold">{schedule.route.company.name}</span>
              <Badge variant="secondary" className="text-xs">
                {schedule.bus.plate_number}
              </Badge>
              <Badge className="bg-emerald-100 text-xs text-emerald-800">
                {getVehicleLabel(vehicleType)}
              </Badge>
            </div>

            <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4 shrink-0" />
                <span>
                  <strong className="text-emerald-700">{availableSeats}</strong> of{" "}
                  {totalSeats} seats left
                </span>
              </span>
              <span>
                <strong className="text-slate-900">Distance:</strong>{" "}
                {schedule.route.distance_km} km
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xl font-bold text-emerald-700">{formatCurrency(fare)}</span>
              <span className="text-xs text-slate-400">
                {bookedSeats} seat{bookedSeats !== 1 ? "s" : ""} already booked
              </span>
            </div>

            <Link href={`/trips/${schedule.id}${boardingOrigin ? `?from=${encodeURIComponent(boardingOrigin)}` : ""}`}>
              <Button size="sm" disabled={availableSeats === 0}>
                {availableSeats === 0 ? "Fully Booked" : "Select Seats & Book"}
              </Button>
            </Link>
          </div>

          <div className="border-t border-slate-100 bg-slate-50 p-4 md:border-l md:border-t-0">
            <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              {getVehicleLabel(vehicleType)} — top view
            </p>
            <SeatMapPreview
              seats={seatList}
              layout={{ ...layout, vehicleType }}
              compact
              showLegend
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
