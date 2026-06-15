import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json();
  const reference = body.data?.reference;
  const metadata = body.data?.metadata ?? {};
  const status = body.data?.status;

  if (!reference || status !== "success") {
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
  const seatIds = (metadata.seat_ids as string)?.split(",").filter(Boolean) ?? [];
  const userId = metadata.user_id;
  const amount = body.data.amount / 100;

  if (!scheduleId || !seatIds.length || !userId) {
    return NextResponse.json({ error: "Invalid metadata" }, { status: 400 });
  }

  await supabase.rpc("confirm_booking", {
    p_schedule_id: scheduleId,
    p_seat_ids: seatIds,
    p_user_id: userId,
    p_payment_ref: reference,
    p_amount: amount,
    p_provider: "paystack",
  });

  return NextResponse.json({ received: true });
}
