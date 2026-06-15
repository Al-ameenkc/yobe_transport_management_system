import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendBookingNotifications } from "@/lib/notifications/booking";

export async function POST(request: Request) {
  const { bookingId } = await request.json();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: booking } = await supabase
    .from("bookings")
    .select("user_id")
    .eq("id", bookingId)
    .single();

  if (!booking || booking.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const result = await sendBookingNotifications(bookingId);
  return NextResponse.json(result);
}
