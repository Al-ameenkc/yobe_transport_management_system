import { cookies } from "next/headers";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export const ADMIN_COOKIE = "tms_admin_auth";

export async function isAdminPasswordAuthenticated() {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_COOKIE)?.value === "authenticated";
}

export async function getAdminClient() {
  if (await isAdminPasswordAuthenticated()) {
    return createServiceClient();
  }
  return createClient();
}

export function validateAdminPassword(password: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return password === expected;
}
