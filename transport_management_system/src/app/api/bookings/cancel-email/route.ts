import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { unwrapRelation } from "@/lib/supabase/helpers";
import { sendCancellationEmail } from "@/lib/email";
import { isAdminPasswordAuthenticated } from "@/lib/admin/session";

export async function POST(request: Request) {
  const { bookingId } = await request.json();
  const supabase = await createClient();
  const service = await createServiceClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAdmin = await isAdminPasswordAuthenticated();

  if (!user && !isAdmin) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: booking } = await service
    .from("bookings")
    .select(
      `
      user_id,
      schedule:schedules(route:routes(origin, destination)),
      ticket:tickets(ticket_code)
    `
    )
    .eq("id", bookingId)
    .single();

  if (!booking) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (user && user.id !== booking.user_id && !isAdmin) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: authData } = await service.auth.admin.getUserById(booking.user_id);
  const email = authData?.user?.email;
  if (!email) {
    return NextResponse.json({ success: true, emailed: false });
  }

  const ticket = unwrapRelation(booking.ticket);
  const schedule = unwrapRelation(booking.schedule);
  const route = unwrapRelation(schedule?.route);

  await sendCancellationEmail({
    to: email,
    ticketCode: ticket?.ticket_code ?? "",
    origin: route?.origin ?? "",
    destination: route?.destination ?? "",
  });

  return NextResponse.json({ success: true, emailed: true });
}
