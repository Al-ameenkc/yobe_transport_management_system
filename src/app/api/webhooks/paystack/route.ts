import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { verifyPaystackWebhookSignature } from "@/lib/payments";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (!verifyPaystackWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const body = JSON.parse(rawBody);
  const event = body.event;
  const data = body.data ?? {};
  const reference = data.reference as string | undefined;
  const metadata = data.metadata ?? {};
  const status = data.status as string | undefined;

  if (event !== "charge.success" || !reference || status !== "success") {
    return NextResponse.json({ received: true });
  }

  const supabase = await createServiceClient();

  const { data: existing } = await supabase
    .from("payments")
    .select("id")
    .eq("reference", reference)
    .single();

  if (existing) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  const scheduleId = metadata.schedule_id;
  const seatIds = String(metadata.seat_ids ?? "")
    .split(",")
    .filter(Boolean);
  const userId = metadata.user_id;
  const passengerPhone = metadata.passenger_phone ?? null;
  const amount = (data.amount ?? 0) / 100;

  if (!scheduleId || !seatIds.length || !userId) {
    return NextResponse.json({ error: "Invalid metadata" }, { status: 400 });
  }

  const { error } = await supabase.rpc("confirm_booking", {
    p_schedule_id: scheduleId,
    p_seat_ids: seatIds,
    p_user_id: userId,
    p_payment_ref: reference,
    p_amount: amount,
    p_provider: "paystack",
    p_passenger_phone: passengerPhone,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
