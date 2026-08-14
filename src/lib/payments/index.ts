import { createHmac, timingSafeEqual } from "crypto";

export interface PaymentInitResult {
  reference: string;
  amount: number;
  provider: string;
  authorizationUrl: string;
}

export interface PaystackVerifyResult {
  success: boolean;
  amount: number;
  reference: string;
  metadata: Record<string, string>;
}

function getPaystackSecret() {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    throw new Error(
      "PAYSTACK_SECRET_KEY is not set. Add your Paystack secret key to .env.local."
    );
  }
  return secret;
}

export async function initializePayment(
  amount: number,
  email: string,
  bookingMeta?: Record<string, string>
): Promise<PaymentInitResult> {
  const secret = getPaystackSecret();
  const reference = `TMS-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      amount: Math.round(amount * 100),
      currency: "NGN",
      reference,
      metadata: bookingMeta,
      callback_url: `${appUrl}/booking/callback`,
    }),
  });

  const data = await res.json();
  if (!data.status || !data.data?.authorization_url) {
    throw new Error(data.message || "Paystack initialization failed");
  }

  return {
    reference,
    amount,
    provider: "paystack",
    authorizationUrl: data.data.authorization_url,
  };
}

export async function verifyPaystackPayment(
  reference: string
): Promise<PaystackVerifyResult> {
  const secret = getPaystackSecret();
  const res = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: {
        Authorization: `Bearer ${secret}`,
      },
    }
  );

  const data = await res.json();
  const metadata = (data.data?.metadata ?? {}) as Record<string, string>;

  return {
    success: Boolean(data.status && data.data?.status === "success"),
    amount: (data.data?.amount ?? 0) / 100,
    reference: data.data?.reference ?? reference,
    metadata,
  };
}

export function verifyPaystackWebhookSignature(
  rawBody: string,
  signature: string | null
) {
  if (!signature) return false;

  const hash = createHmac("sha512", getPaystackSecret())
    .update(rawBody)
    .digest("hex");

  const expected = Buffer.from(hash);
  const received = Buffer.from(signature);

  if (expected.length !== received.length) return false;
  return timingSafeEqual(expected, received);
}
