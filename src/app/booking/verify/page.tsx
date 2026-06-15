import { Suspense } from "react";
import VerifyContent from "./verify-content";

export default function VerifyPaymentPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[50vh] items-center justify-center">Loading...</div>}>
      <VerifyContent />
    </Suspense>
  );
}
