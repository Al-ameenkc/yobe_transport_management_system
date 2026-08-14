"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Building2, CreditCard, ShieldCheck, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";

function normalizePhone(phone: string) {
  return phone.replace(/\s+/g, "").trim();
}

function isValidPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

const PAYMENT_METHODS = [
  { icon: CreditCard, label: "Card" },
  { icon: Building2, label: "Bank" },
  { icon: Smartphone, label: "USSD" },
];

export default function CheckoutContent() {
  const searchParams = useSearchParams();
  const scheduleId = searchParams.get("scheduleId") ?? "";
  const seatIds = (searchParams.get("seatIds") ?? "").split(",").filter(Boolean);
  const amount = parseFloat(searchParams.get("amount") ?? "0");
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePay() {
    const phone = normalizePhone(mobile);
    if (!isValidPhone(phone)) {
      setError("Please enter a valid mobile number (at least 10 digits).");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduleId,
          seatIds,
          passengerPhone: phone,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.authorizationUrl) {
        throw new Error(data.error || "Could not start Paystack payment");
      }

      window.location.href = data.authorizationUrl;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start payment");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Complete Booking</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm text-slate-600">
            Seats selected: <strong>{seatIds.length}</strong>
          </p>
          <p className="text-2xl font-bold text-emerald-700">
            {formatCurrency(amount)}
          </p>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Pay with Paystack</p>
            <p className="mt-1 text-sm text-slate-600">
              You will be redirected to Paystack to complete payment. Your
              e-ticket is issued only after the payment succeeds.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {PAYMENT_METHODS.map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </span>
              ))}
            </div>
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

          <Button className="w-full" onClick={handlePay} loading={loading}>
            Pay {formatCurrency(amount)} with Paystack
          </Button>

          <p className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            Payments are secured by Paystack
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
