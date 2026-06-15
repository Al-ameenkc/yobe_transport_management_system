import { NextResponse } from "next/server";
import { getAdminClient, isAdminPasswordAuthenticated } from "@/lib/admin/session";
import { unwrapRelation } from "@/lib/supabase/helpers";
import { parseTicketInput } from "@/lib/tickets/parse-ticket-input";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils";

async function getVerifyClient() {
  if (await isAdminPasswordAuthenticated()) {
    return getAdminClient();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "staff"].includes(profile.role)) return null;
  return supabase;
}

export async function POST(request: Request) {
  const { ticketCode: rawInput } = await request.json();

  if (!rawInput) {
    return NextResponse.json({ error: "Ticket code required" }, { status: 400 });
  }

  const supabase = await getVerifyClient();
  if (!supabase) {
    return NextResponse.json({ error: "Not authorized to verify tickets" }, { status: 401 });
  }

  const ticketCode = parseTicketInput(rawInput);
  if (!ticketCode) {
    return NextResponse.json({ error: "Ticket code required" }, { status: 400 });
  }

  let { data: ticket } = await supabase
    .from("tickets")
    .select(
      `
      ticket_code,
      booking:bookings(
        user_id,
        status,
        schedule:schedules(
          departure_at,
          route:routes(origin, destination)
        ),
        booking_seats(seat:seats(seat_number))
      )
    `
    )
    .eq("ticket_code", ticketCode)
    .maybeSingle();

  if (!ticket) {
    const { data: byPayload } = await supabase
      .from("tickets")
      .select(
        `
        ticket_code,
        booking:bookings(
          user_id,
          status,
          schedule:schedules(
            departure_at,
            route:routes(origin, destination)
          ),
          booking_seats(seat:seats(seat_number))
        )
      `
      )
      .ilike("qr_payload", `%${ticketCode}%`)
      .maybeSingle();
    ticket = byPayload;
  }

  if (!ticket) {
    return NextResponse.json({ error: "Invalid ticket" }, { status: 404 });
  }

  const booking = unwrapRelation(ticket.booking);
  if (!booking || booking.status !== "confirmed") {
    return NextResponse.json(
      {
        error: booking?.status === "cancelled" ? "Ticket cancelled" : "Ticket not valid",
      },
      { status: 400 }
    );
  }

  const schedule = unwrapRelation(booking.schedule);
  const route = unwrapRelation(schedule?.route);

  let passengerName = "Unknown";
  const userId = (booking as { user_id?: string }).user_id;
  if (userId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .maybeSingle();
    if (profile?.full_name) passengerName = profile.full_name;
  }

  const seats = (booking.booking_seats ?? [])
    .map((bs: { seat: { seat_number: string } | { seat_number: string }[] }) => {
      const seat = unwrapRelation(bs.seat);
      return seat?.seat_number;
    })
    .filter(Boolean)
    .join(", ");

  return NextResponse.json({
    ticketCode: ticket.ticket_code,
    passenger: passengerName,
    route: `${route?.origin} → ${route?.destination}`,
    departure: schedule ? formatDateTime(schedule.departure_at) : "",
    seats,
    status: booking.status,
  });
}
