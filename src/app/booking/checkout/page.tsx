import { Suspense } from "react";
import CheckoutContent from "./checkout-content";

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[50vh] items-center justify-center">Loading...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
