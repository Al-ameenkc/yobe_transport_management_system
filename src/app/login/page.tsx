import { Suspense } from "react";
import LoginPage from "./login-content";

export default function Login() {
  return (
    <Suspense fallback={<div className="flex min-h-[70vh] items-center justify-center">Loading...</div>}>
      <LoginPage />
    </Suspense>
  );
}
