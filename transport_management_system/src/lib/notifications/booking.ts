import { createClient, createServiceClient } from "@/lib/supabase/server";
import { unwrapRelation } from "@/lib/supabase/helpers";
import { sendBookingConfirmation } from "@/lib/email";
import { sendTicketSms } from "@/lib/sms";
import { formatDateTime } from "@/lib/utils";

export async function sendBookingNotifications(bookingId: string) {
  const supabase = await createClient();
  const service = await createServiceClient();

  const { data: booking } = await supabase
    .from("bookings")
    .select(
      `
      total_amount,
      user_id,
      schedule:schedules(departure_at, route:routes(origin, destination)),
      ticket:tickets(ticket_code),
      booking_seats(seat:seats(seat_number))
    `
    )
    .eq("id", bookingId)
    .single();

  if (!booking) return { success: false, error: "Booking not found" };

  const { data: authData } = await service.auth.admin.getUserById(booking.user_id);

  const { data: profile } = await supabase
    .from("profiles")
    .select("phone, full_name")
    .eq("id", booking.user_id)
    .single();

  const ticket = unwrapRelation(booking.ticket);
  const schedule = unwrapRelation(booking.schedule);
  const route = unwrapRelation(schedule?.route);
  const seats = (booking.booking_seats ?? [])
    .map((bs: { seat: { seat_number: string } | { seat_number: string }[] }) => {
      const seat = unwrapRelation(bs.seat);
      return seat?.seat_number;
    })
    .filter((s): s is string => Boolean(s));

  const ticketCode = ticket?.ticket_code ?? "";
  const origin = route?.origin ?? "Yobe";
  const destination = route?.destination ?? "";
  const departureAt = schedule ? formatDateTime(schedule.departure_at) : "";

  const email = authData?.user?.email;
  if (email) {
    await sendBookingConfirmation({
      to: email,
      ticketCode,
      origin,
      destination,
      departureAt,
      seats,
      amount: booking.total_amount,
    });
  }

  const phone = profile?.phone;
  if (phone) {
    await sendTicketSms({
      phone,
      ticketCode,
      origin,
      destination,
      departureAt,
    });
  }

  return { success: true, emailSent: !!email, smsSent: !!phone };
}
