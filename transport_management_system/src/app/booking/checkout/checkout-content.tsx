"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { confirmBooking } from "@/lib/booking/actions";
import { formatCurrency } from "@/lib/utils";

export default function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const scheduleId = searchParams.get("scheduleId") ?? "";
  const seatIds = (searchParams.get("seatIds") ?? "").split(",").filter(Boolean);
  const amount = parseFloat(searchParams.get("amount") ?? "0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleMockPayment() {
    setLoading(true);
    setError(null);

    try {
      const initRes = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, scheduleId, seatIds }),
      });
      const initData = await initRes.json();

      if (initData.authorizationUrl) {
        window.location.href = initData.authorizationUrl;
        return;
      }

      const result = await confirmBooking(
        scheduleId,
        seatIds,
        amount,
        initData.reference,
        initData.provider
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
      setError(e instanceof Error ? e.message : "Payment failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Checkout</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">
            Seats selected: <strong>{seatIds.length}</strong>
          </p>
          <p className="text-2xl font-bold text-emerald-700">
            {formatCurrency(amount)}
          </p>

          <div className="rounded-lg border border-slate-200 p-4 text-sm">
            <p className="font-medium">Payment Methods</p>
            <ul className="mt-2 list-inside list-disc text-slate-600">
              <li>Debit Card (via Paystack when configured)</li>
              <li>Bank Transfer</li>
              <li>Mock Payment (development)</li>
            </ul>
          </div>

          {error && (
            <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>
          )}

          <Button className="w-full" onClick={handleMockPayment} loading={loading}>
            Pay {formatCurrency(amount)}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
