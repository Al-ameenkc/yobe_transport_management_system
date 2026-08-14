"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { adminCancelBooking } from "@/lib/admin/actions";

export function AdminCancelBookingButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleCancel() {
    if (!confirm("Cancel this ticket? Seats will be released for resale.")) return;
    setLoading(true);
    try {
      await adminCancelBooking(bookingId);
      await fetch("/api/bookings/cancel-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not cancel ticket");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="destructive" size="sm" onClick={handleCancel} loading={loading}>
      Cancel Ticket
    </Button>
  );
}
