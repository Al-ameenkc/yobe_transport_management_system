import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { initializePayment } from "@/lib/payments";
import { getScheduleById, getScheduleFare } from "@/lib/booking/queries";

export async function POST(request: Request) {
  try {
    const { scheduleId, seatIds, passengerPhone } = await request.json();
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (!scheduleId || !Array.isArray(seatIds) || seatIds.length === 0) {
      return NextResponse.json({ error: "Missing booking details" }, { status: 400 });
    }

    const phone = String(passengerPhone ?? "").replace(/\s+/g, "").trim();
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 15) {
      return NextResponse.json(
        { error: "Please enter a valid mobile number" },
        { status: 400 }
      );
    }

    const schedule = await getScheduleById(scheduleId);
    const fare = getScheduleFare(schedule);
    const amount = fare * seatIds.length;

    const result = await initializePayment(amount, user.email, {
      schedule_id: scheduleId,
      seat_ids: seatIds.join(","),
      user_id: user.id,
      passenger_phone: phone,
    });

    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not start payment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
