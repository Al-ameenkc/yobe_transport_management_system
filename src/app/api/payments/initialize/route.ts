import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { initializePayment } from "@/lib/payments";

export async function POST(request: Request) {
  const { amount, scheduleId, seatIds } = await request.json();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const result = await initializePayment(amount, user.email!, {
    schedule_id: scheduleId,
    seat_ids: seatIds.join(","),
    user_id: user.id,
  });

  return NextResponse.json(result);
}
