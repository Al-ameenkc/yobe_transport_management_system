import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { chatWithSupport } from "@/lib/ai";

export async function POST(request: Request) {
  const { messages } = await request.json();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let context = "";
  if (user) {
    const { data: bookings } = await supabase
      .from("bookings")
      .select("status, schedule:schedules(route:routes(origin, destination))")
      .eq("user_id", user.id)
      .limit(3);
    if (bookings?.length) {
      context = `User bookings: ${JSON.stringify(bookings)}`;
    }
  }

  const reply = await chatWithSupport(messages, context);
  return NextResponse.json({ reply });
}
