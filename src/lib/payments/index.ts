export interface PaymentInitResult {
  reference: string;
  amount: number;
  provider: string;
  authorizationUrl?: string;
}

export async function initializePayment(
  amount: number,
  email: string,
  bookingMeta?: Record<string, string>
): Promise<PaymentInitResult> {
  const reference = `TMS-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  if (process.env.PAYSTACK_SECRET_KEY) {
    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: Math.round(amount * 100),
        reference,
        metadata: bookingMeta,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/booking/callback`,
      }),
    });

    const data = await res.json();
    if (!data.status) {
      throw new Error(data.message || "Paystack initialization failed");
    }

    return {
      reference,
      amount,
      provider: "paystack",
      authorizationUrl: data.data.authorization_url,
    };
  }

  return {
    reference,
    amount,
    provider: "mock",
  };
}

export async function verifyPaystackPayment(reference: string): Promise<boolean> {
  if (!process.env.PAYSTACK_SECRET_KEY) return true;

  const res = await fetch(
    `https://api.paystack.co/transaction/verify/${reference}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    }
  );

  const data = await res.json();
  return data.status && data.data.status === "success";
}
