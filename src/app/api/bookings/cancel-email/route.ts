import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { unwrapRelation } from "@/lib/supabase/helpers";
import { sendCancellationEmail } from "@/lib/email";

export async function POST(request: Request) {
  const { bookingId } = await request.json();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: booking } = await supabase
    .from("bookings")
    .select(
      `
      schedule:schedules(route:routes(origin, destination)),
      ticket:tickets(ticket_code)
    `
    )
    .eq("id", bookingId)
    .single();

  if (!booking || !user?.email) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ticket = unwrapRelation(booking.ticket);
  const schedule = unwrapRelation(booking.schedule);
  const route = unwrapRelation(schedule?.route);

  await sendCancellationEmail({
    to: user.email,
    ticketCode: ticket?.ticket_code ?? "",
    origin: route?.origin ?? "",
    destination: route?.destination ?? "",
  });

  return NextResponse.json({ success: true });
}
