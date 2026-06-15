export async function sendTicketSms({
  phone,
  ticketCode,
  origin,
  destination,
  departureAt,
}: {
  phone: string;
  ticketCode: string;
  origin: string;
  destination: string;
  departureAt: string;
}) {
  const message = `TMS Yobe: Your ticket ${ticketCode} for ${origin} to ${destination} on ${departureAt} is confirmed. Show this code at the terminal.`;

  if (process.env.TERMII_API_KEY && process.env.TERMII_SENDER_ID) {
    const res = await fetch("https://api.ng.termii.com/api/sms/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: phone.replace(/\s/g, ""),
        from: process.env.TERMII_SENDER_ID,
        sms: message,
        type: "plain",
        channel: "generic",
        api_key: process.env.TERMII_API_KEY,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`SMS failed: ${err}`);
    }
    return { success: true };
  }

  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    const auth = Buffer.from(
      `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
    ).toString("base64");

    const body = new URLSearchParams({
      To: phone,
      From: process.env.TWILIO_PHONE_NUMBER ?? "",
      Body: message,
    });

    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      }
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`SMS failed: ${err}`);
    }
    return { success: true };
  }

  console.log("[SMS mock]", phone, message);
  return { success: true, mock: true };
}
