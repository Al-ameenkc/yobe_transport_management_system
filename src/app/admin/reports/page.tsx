import { getAdminClient } from "@/lib/admin/session";
import { unwrapRelation } from "@/lib/supabase/helpers";
import { ReportsClient } from "@/components/admin/reports-client";
import { format, subDays } from "date-fns";

export default async function AdminReportsPage() {
  const supabase = await getAdminClient();

  const { data: payments } = await supabase
    .from("payments")
    .select("amount, created_at, booking:bookings(schedule:schedules(route:routes(origin, destination)))")
    .eq("status", "success")
    .gte("created_at", subDays(new Date(), 30).toISOString());

  const dailyMap: Record<string, { revenue: number; bookings: number }> = {};
  const routeMap: Record<string, { bookings: number; revenue: number }> = {};

  for (let i = 29; i >= 0; i--) {
    const d = format(subDays(new Date(), i), "MMM dd");
    dailyMap[d] = { revenue: 0, bookings: 0 };
  }

  (payments ?? []).forEach((p) => {
    const dateKey = format(new Date(p.created_at), "MMM dd");
    if (dailyMap[dateKey]) {
      dailyMap[dateKey].revenue += Number(p.amount);
      dailyMap[dateKey].bookings += 1;
    }

    const booking = unwrapRelation(p.booking);
    const schedule = unwrapRelation(booking?.schedule);
    const route = unwrapRelation(schedule?.route);
    if (route) {
      const key = `${route.origin} → ${route.destination}`;
      if (!routeMap[key]) routeMap[key] = { bookings: 0, revenue: 0 };
      routeMap[key].bookings += 1;
      routeMap[key].revenue += Number(p.amount);
    }
  });

  const dailyRevenue = Object.entries(dailyMap).map(([date, data]) => ({
    date,
    ...data,
  }));

  const routePerformance = Object.entries(routeMap).map(([route, data]) => ({
    route,
    ...data,
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold">Reports & Analytics</h1>
      <p className="text-slate-500">Revenue and route performance for the last 30 days</p>
      <ReportsClient dailyRevenue={dailyRevenue} routePerformance={routePerformance} />
    </div>
  );
}

