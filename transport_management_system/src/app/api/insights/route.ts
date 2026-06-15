import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateAdminInsights } from "@/lib/ai";

export async function POST() {
  const supabase = await createClient();

  const { data: stats } = await supabase.rpc("get_dashboard_stats", { p_days: 7 });

  const { data: bookings } = await supabase
    .from("bookings")
    .select("status, total_amount, schedule:schedules(route:routes(origin, destination))")
    .gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString());

  const payload = JSON.stringify({
    dashboard: stats?.[0],
    recentBookings: bookings,
    period: "last 7 days",
  });

  const insights = await generateAdminInsights(payload);
  return NextResponse.json({ insights });
}
