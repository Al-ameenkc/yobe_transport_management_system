"use client";

import { useState } from "react";
import Link from "next/link";
import { cancelBooking } from "@/lib/booking/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDateTime } from "@/lib/utils";

interface BookingRow {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  schedule: {
    departure_at: string;
    route: { origin: string; destination: string; company: { name: string } };
  };
  ticket: { ticket_code: string } | { ticket_code: string }[] | null;
}

export function BookingsList({ bookings }: { bookings: BookingRow[] }) {
  const [cancelling, setCancelling] = useState<string | null>(null);

  async function handleCancel(bookingId: string) {
    if (!confirm("Cancel this booking?")) return;
    setCancelling(bookingId);
    try {
      await cancelBooking(bookingId);
      await fetch("/api/bookings/cancel-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      window.location.reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Cancellation failed");
    } finally {
      setCancelling(null);
    }
  }

  if (bookings.length === 0) {
    return (
      <div className="mt-8 text-center text-slate-500">
        <p>No bookings yet.</p>
        <Link href="/search" className="mt-2 inline-block text-emerald-600 hover:underline">
          Search for buses
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {bookings.map((booking) => {
        const ticket = Array.isArray(booking.ticket)
          ? booking.ticket[0]
          : booking.ticket;

        return (
          <Card key={booking.id}>
            <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">
                  {booking.schedule.route.origin} → {booking.schedule.route.destination}
                </p>
                <p className="text-sm text-slate-500">
                  {booking.schedule.route.company.name} ·{" "}
                  {formatDateTime(booking.schedule.departure_at)}
                </p>
                <p className="text-sm">
                  {ticket?.ticket_code && (
                    <span className="text-slate-600">Ticket: {ticket.ticket_code} · </span>
                  )}
                  {formatCurrency(booking.total_amount)}
                </p>
                <Badge
                  variant={
                    booking.status === "confirmed"
                      ? "default"
                      : booking.status === "cancelled"
                        ? "destructive"
                        : "secondary"
                  }
                  className="mt-1"
                >
                  {booking.status}
                </Badge>
              </div>
              <div className="flex gap-2">
                {booking.status === "confirmed" && (
                  <>
                    <Link href={`/tickets/${booking.id}`}>
                      <Button variant="outline" size="sm">
                        View Ticket
                      </Button>
                    </Link>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleCancel(booking.id)}
                      disabled={cancelling === booking.id}
                    >
                      {cancelling === booking.id ? "Cancelling..." : "Cancel"}
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
