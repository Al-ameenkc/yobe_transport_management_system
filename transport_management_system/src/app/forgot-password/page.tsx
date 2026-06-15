"use client";

import Link from "next/link";
import { resetPassword } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useActionState } from "react";

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, formData: FormData) => {
      const result = await resetPassword(formData);
      return result ?? null;
    },
    null
  );

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>We will send a reset link to your email</CardDescription>
        </CardHeader>
        <CardContent>
          {state?.success && (
            <p className="mb-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">
              Check your email for the reset link.
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
            <Button type="submit" className="w-full" loading={pending}>
              Send Reset Link
            </Button>
          </form>
          <p className="mt-4 text-center text-sm">
            <Link href="/login" className="text-emerald-600 hover:underline">
              Back to login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
