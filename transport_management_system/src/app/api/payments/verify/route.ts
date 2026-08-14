import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyPaystackPayment } from "@/lib/payments";
import { confirmBooking } from "@/lib/booking/actions";
import { sendBookingNotifications } from "@/lib/notifications/booking";

export async function POST(request: Request) {
  const { reference } = await request.json();

  if (!reference) {
    return NextResponse.json({ error: "Missing reference" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const payment = await verifyPaystackPayment(reference);
    if (!payment.success) {
      return NextResponse.json({ error: "Payment not verified" }, { status: 400 });
    }

    const scheduleId = payment.metadata.schedule_id;
    const seatIds = (payment.metadata.seat_ids ?? "").split(",").filter(Boolean);
    const passengerPhone = payment.metadata.passenger_phone;

    if (!scheduleId || seatIds.length === 0) {
      return NextResponse.json({ error: "Invalid payment metadata" }, { status: 400 });
    }

    const result = await confirmBooking(
      scheduleId,
      seatIds,
      payment.amount,
      payment.reference,
      "paystack",
      passengerPhone
    );

    if (result?.booking_id) {
      await sendBookingNotifications(result.booking_id);
    }

    return NextResponse.json({ bookingId: result?.booking_id });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Verification failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
