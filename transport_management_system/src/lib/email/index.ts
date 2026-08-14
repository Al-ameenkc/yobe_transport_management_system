import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function sendBookingConfirmation({
  to,
  ticketCode,
  origin,
  destination,
  departureAt,
  seats,
  amount,
}: {
  to: string;
  ticketCode: string;
  origin: string;
  destination: string;
  departureAt: string;
  seats: string[];
  amount: number;
}) {
  if (!resend) {
    console.log("[Email mock] Booking confirmation to", to, ticketCode);
    return { success: true, mock: true };
  }

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "YOBE LINE <onboarding@resend.dev>",
    to,
    subject: `Booking Confirmed — ${ticketCode}`,
    html: `
      <h2>Your bus ticket is confirmed!</h2>
      <p><strong>Ticket:</strong> ${ticketCode}</p>
      <p><strong>Route:</strong> ${origin} → ${destination}</p>
      <p><strong>Departure:</strong> ${departureAt}</p>
      <p><strong>Seats:</strong> ${seats.join(", ")}</p>
      <p><strong>Amount paid:</strong> ₦${amount.toLocaleString()}</p>
      <p>Present your e-ticket QR code at the terminal.</p>
      <p>View and download your ticket: <a href="${process.env.NEXT_PUBLIC_APP_URL}/tickets">My Tickets</a></p>
    `,
  });

  if (error) throw error;
  return { success: true };
}

export async function sendCancellationEmail({
  to,
  ticketCode,
  origin,
  destination,
}: {
  to: string;
  ticketCode: string;
  origin: string;
  destination: string;
}) {
  if (!resend) {
    console.log("[Email mock] Cancellation to", to, ticketCode);
    return { success: true, mock: true };
  }

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "YOBE LINE <onboarding@resend.dev>",
    to,
    subject: `Booking Cancelled — ${ticketCode}`,
    html: `
      <h2>Your booking has been cancelled</h2>
      <p><strong>Ticket:</strong> ${ticketCode}</p>
      <p><strong>Route:</strong> ${origin} → ${destination}</p>
      <p>If eligible, your refund will be processed within 5–7 business days.</p>
    `,
  });

  if (error) throw error;
  return { success: true };
}
