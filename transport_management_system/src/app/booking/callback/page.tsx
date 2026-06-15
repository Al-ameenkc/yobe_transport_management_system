import { Suspense } from "react";
import CallbackContent from "./callback-content";

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[50vh] items-center justify-center">Loading...</div>}>
      <CallbackContent />
    </Suspense>
  );
}
