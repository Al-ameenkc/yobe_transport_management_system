"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useActionState } from "react";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  const registered = searchParams.get("registered");

  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      formData.set("redirect", redirect);
      const result = await signIn(formData);
      return result ?? null;
    },
    null
  );

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Sign in to book buses and manage your tickets</CardDescription>
        </CardHeader>
        <CardContent>
          {registered && (
            <p className="mb-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">
              Account created! Please sign in.
            </p>
          )}
          {state?.error && (
            <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{state.error}</p>
          )}
          <form action={formAction} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required className="mt-1" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required className="mt-1" />
            </div>
            <Button type="submit" className="w-full" loading={pending}>
              Sign In
            </Button>
          </form>
          <div className="mt-4 space-y-2 text-center text-sm">
            <Link href="/forgot-password" className="text-emerald-600 hover:underline">
              Forgot password?
            </Link>
            <p>
              No account?{" "}
              <Link href="/register" className="font-medium text-emerald-600 hover:underline">
                Register
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
