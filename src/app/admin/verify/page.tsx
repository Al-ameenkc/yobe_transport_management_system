"use client";

import { useState } from "react";
import { parseTicketInput } from "@/lib/tickets/parse-ticket-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function VerifyTicketPage() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function verify() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/tickets/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketCode: parseTicketInput(code) || code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Verification failed");
      } else {
        setResult(data);
      }
    } catch {
      setError("Verification failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Verify Ticket</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="code">Ticket Code or QR Payload</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="TMS-XXXXXXXXXXXX"
              className="mt-1"
            />
          </div>
          <Button onClick={verify} loading={loading} disabled={!code.trim()}>
            Verify
          </Button>

          {error && (
            <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>
          )}

          {result && (
            <div className="rounded-lg bg-emerald-50 p-4 text-sm space-y-2">
              <Badge>Valid Ticket</Badge>
              <p><strong>Code:</strong> {String(result.ticketCode)}</p>
              <p><strong>Passenger:</strong> {String(result.passenger)}</p>
              <p><strong>Route:</strong> {String(result.route)}</p>
              <p><strong>Departure:</strong> {String(result.departure)}</p>
              <p><strong>Seats:</strong> {String(result.seats)}</p>
              <p><strong>Status:</strong> {String(result.status)}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

