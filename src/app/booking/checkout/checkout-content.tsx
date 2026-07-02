"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { confirmBooking } from "@/lib/booking/actions";
import { formatCurrency } from "@/lib/utils";

function normalizePhone(phone: string) {
  return phone.replace(/\s+/g, "").trim();
}

function isValidPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

export default function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const scheduleId = searchParams.get("scheduleId") ?? "";
  const seatIds = (searchParams.get("seatIds") ?? "").split(",").filter(Boolean);
  const amount = parseFloat(searchParams.get("amount") ?? "0");
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleIssueTicket() {
    const phone = normalizePhone(mobile);
    if (!isValidPhone(phone)) {
      setError("Please enter a valid mobile number (at least 10 digits).");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const reference = `OFFLINE-${crypto.randomUUID()}`;
      const result = await confirmBooking(
        scheduleId,
        seatIds,
        amount,
        reference,
        "offline",
        phone
      );

      if (result?.booking_id) {
        await fetch("/api/bookings/confirm-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId: result.booking_id }),
        });
        router.push(`/tickets/${result.booking_id}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not issue ticket");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Complete Booking</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">
            Seats selected: <strong>{seatIds.length}</strong>
          </p>
          <p className="text-2xl font-bold text-emerald-700">
            {formatCurrency(amount)}
          </p>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-medium">Payment</p>
            <p className="mt-1">
              We do not accept payment online for now. Pay at the terminal before
              boarding. Your ticket will be issued after you confirm this booking.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mobile">Mobile number</Label>
            <Input
              id="mobile"
              type="tel"
              placeholder="e.g. 08012345678"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              autoComplete="tel"
              required
            />
            <p className="text-xs text-slate-500">
              We will use this number to contact you if you do not show up for your trip.
            </p>
          </div>

          {error && (
            <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>
          )}

          <Button className="w-full" onClick={handleIssueTicket} loading={loading}>
            Issue Ticket
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
