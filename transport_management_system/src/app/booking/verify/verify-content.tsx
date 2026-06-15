"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageLoader } from "@/components/ui/page-loader";

export default function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reference = searchParams.get("reference");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!reference) return;

    fetch("/api/payments/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reference }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.bookingId) {
          router.replace(`/tickets/${data.bookingId}`);
        } else {
          setError(data.error || "Verification failed");
        }
      })
      .catch(() => setError("Verification failed"));
  }, [reference, router]);

  if (error) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return <PageLoader message="Confirming your booking..." fullScreen />;
}
