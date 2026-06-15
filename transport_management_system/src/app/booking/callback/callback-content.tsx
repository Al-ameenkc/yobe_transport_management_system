"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageLoader } from "@/components/ui/page-loader";

export default function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reference = searchParams.get("reference");

  useEffect(() => {
    if (reference) {
      router.replace(`/booking/verify?reference=${reference}`);
    }
  }, [reference, router]);

  return <PageLoader message="Verifying payment..." fullScreen />;
}
