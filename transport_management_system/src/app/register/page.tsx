"use client";

import Link from "next/link";
import { signUp } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useActionState } from "react";

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      const result = await signUp(formData);
      return result ?? null;
    },
    null
  );

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Account</CardTitle>
          <CardDescription>Register to start booking bus trips</CardDescription>
        </CardHeader>
        <CardContent>
          {state?.error && (
            <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{state.error}</p>
          )}
          <form action={formAction} className="space-y-4">
            <div>
              <Label htmlFor="full_name">Full Name</Label>
              <Input id="full_name" name="full_name" required className="mt-1" />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" type="tel" placeholder="+234..." className="mt-1" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required className="mt-1" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" minLength={6} required className="mt-1" />
            </div>
            <Button type="submit" className="w-full" loading={pending}>
              Register
            </Button>
          </form>
          <p className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-emerald-600 hover:underline">
              Login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
