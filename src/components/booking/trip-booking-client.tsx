"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SeatMap } from "@/components/booking/seat-map";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { holdSeats } from "@/lib/booking/actions";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { ScheduleWithDetails, Seat, SeatLayout } from "@/types/database";

interface TripBookingClientProps {
  schedule: ScheduleWithDetails;
  seats: Seat[];
  fare: number;
  userId: string;
}

export function TripBookingClient({
  schedule,
  seats,
  fare,
  userId,
}: TripBookingClientProps) {
  const router = useRouter();
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const layout = schedule.bus.seat_layout as SeatLayout;
  const total = fare * selectedSeatIds.length;

  async function proceedToCheckout() {
    if (selectedSeatIds.length === 0) {
      setError("Please select at least one seat");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await holdSeats(schedule.id, selectedSeatIds);
      const params = new URLSearchParams({
        scheduleId: schedule.id,
        seatIds: selectedSeatIds.join(","),
        amount: total.toString(),
      });
      router.push(`/booking/checkout?${params.toString()}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to hold seats");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Select Your Seats</CardTitle>
          </CardHeader>
          <CardContent>
            <SeatMap
              scheduleId={schedule.id}
              seats={seats}
              layout={layout}
              selectedSeatIds={selectedSeatIds}
              onSelectionChange={setSelectedSeatIds}
              currentUserId={userId}
            />
          </CardContent>
        </Card>
      </div>

      <div>
        <Card className="sticky top-24">
          <CardHeader>
            <CardTitle className="text-lg">Trip Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              <span className="text-slate-500">Operator:</span>{" "}
              {schedule.route.company.name}
            </p>
            <p>
              <span className="text-slate-500">Route:</span>{" "}
              {schedule.route.origin} → {schedule.route.destination}
            </p>
            <p>
              <span className="text-slate-500">Departure:</span>{" "}
              {formatDateTime(schedule.departure_at)}
            </p>
            <p>
              <span className="text-slate-500">Bus:</span> {schedule.bus.plate_number}
            </p>
            <p>
              <span className="text-slate-500">Fare per seat:</span> {formatCurrency(fare)}
            </p>
            <p>
              <span className="text-slate-500">Selected:</span>{" "}
              {selectedSeatIds.length || "None"}
            </p>
            <p className="text-lg font-bold text-emerald-700">
              Total: {formatCurrency(total)}
            </p>

            {error && (
              <p className="rounded-md bg-red-50 p-2 text-red-700">{error}</p>
            )}

            {!userId ? (
              <Link href={`/login?redirect=/trips/${schedule.id}`}>
                <Button className="w-full">Login to Book</Button>
              </Link>
            ) : (
              <Button
                className="w-full"
                onClick={proceedToCheckout}
                loading={loading}
                disabled={selectedSeatIds.length === 0}
              >
                Proceed to Payment
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
