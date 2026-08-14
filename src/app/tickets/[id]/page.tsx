import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import { unwrapRelation } from "@/lib/supabase/helpers";
import { getCurrentUser } from "@/lib/auth/actions";
import { TicketView } from "@/components/tickets/ticket-view";

interface TicketPageProps {
  params: Promise<{ id: string }>;
}

export default async function TicketPage({ params }: TicketPageProps) {
  const { id } = await params;
  const session = await getCurrentUser();
  const supabase = await createClient();

  const { data: booking } = await supabase
    .from("bookings")
    .select(
      `
      *,
      schedule:schedules(
        *,
        route:routes(*, company:companies(*)),
        bus:buses(*)
      ),
      ticket:tickets(*),
      booking_seats(
        seat:seats(seat_number)
      )
    `
    )
    .eq("id", id)
    .single();

  if (!booking) notFound();

  const isOwner = session?.user?.id === booking.user_id;
  const isStaff = ["admin", "staff"].includes(session?.profile?.role ?? "");

  if (!isOwner && !isStaff) notFound();

  const ticket = unwrapRelation(booking.ticket);
  if (!ticket) notFound();

  const schedule = unwrapRelation(booking.schedule);
  const route = unwrapRelation(schedule?.route);
  const company = unwrapRelation(route?.company);
  const bus = unwrapRelation(schedule?.bus);

  const qrDataUrl = await QRCode.toDataURL(ticket.qr_payload, { width: 200 });

  const seatNumbers = (booking.booking_seats ?? [])
    .map((bs: { seat: { seat_number: string } | { seat_number: string }[] }) => {
      const seat = unwrapRelation(bs.seat);
      return seat?.seat_number;
    })
    .filter((s: string | undefined): s is string => Boolean(s));

  return (
    <div className="mx-auto max-w-lg px-3 py-6 sm:px-4 sm:py-8">
      <TicketView
        data={{
          ticketCode: ticket.ticket_code,
          qrDataUrl,
          companyName: company?.name ?? "",
          origin: route?.origin ?? "Yobe",
          destination: route?.destination ?? "",
          departureAt: schedule?.departure_at ?? "",
          plateNumber: bus?.plate_number ?? "",
          seatNumbers,
          amount: booking.total_amount,
          status: booking.status,
        }}
      />
    </div>
  );
}
