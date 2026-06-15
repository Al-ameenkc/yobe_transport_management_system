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

  if (process.env.PAYSTACK_SECRET_KEY) {
    const verified = await verifyPaystackPayment(reference);
    if (!verified) {
      return NextResponse.json({ error: "Payment not verified" }, { status: 400 });
    }

    const res = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
      }
    );
    const paystackData = await res.json();
    const metadata = paystackData.data?.metadata ?? {};
    const scheduleId = metadata.schedule_id;
    const seatIds = (metadata.seat_ids as string)?.split(",").filter(Boolean) ?? [];
    const amount = paystackData.data.amount / 100;

    const result = await confirmBooking(
      scheduleId,
      seatIds,
      amount,
      reference,
      "paystack"
    );

    if (result?.booking_id) {
      await sendBookingNotifications(result.booking_id);
    }

    return NextResponse.json({ bookingId: result?.booking_id });
  }

  const { data: existing } = await supabase
    .from("payments")
    .select("booking_id")
    .eq("reference", reference)
    .single();

  if (existing) {
    return NextResponse.json({ bookingId: existing.booking_id });
  }

  return NextResponse.json({ error: "Payment not found" }, { status: 404 });
}
