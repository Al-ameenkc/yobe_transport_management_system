import { getAdminClient } from "@/lib/admin/session";
import { unwrapRelation } from "@/lib/supabase/helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Ticket, DollarSign, Route, Users } from "lucide-react";

export default async function AdminDashboardPage() {
  const supabase = await getAdminClient();

  const { data: stats } = await supabase.rpc("get_dashboard_stats", {
    p_days: 30,
  });

  const dashboard = stats?.[0] ?? {
    total_bookings: 0,
    total_revenue: 0,
    active_routes: 0,
    occupancy_rate: 0,
  };

  const cards = [
    {
      title: "Total Bookings",
      value: dashboard.total_bookings,
      icon: Ticket,
      format: (v: number) => v.toString(),
    },
    {
      title: "Total Revenue",
      value: dashboard.total_revenue,
      icon: DollarSign,
      format: (v: number) => formatCurrency(v),
    },
    {
      title: "Active Routes",
      value: dashboard.active_routes,
      icon: Route,
      format: (v: number) => v.toString(),
    },
    {
      title: "Occupancy Rate",
      value: dashboard.occupancy_rate,
      icon: Users,
      format: (v: number) => `${v}%`,
    },
  ];

  const { data: recentBookings } = await supabase
    .from("bookings")
    .select(
      `
      id, status, total_amount, created_at,
      schedule:schedules(departure_at, route:routes(origin, destination))
    `
    )
    .order("created_at", { ascending: false })
    .limit(5);

  const recentIds = (recentBookings ?? []).map((b) => b.id);
  const phoneByBookingId = new Map<string, string>();

  if (recentIds.length > 0) {
    const { data: phoneRows } = await supabase
      .from("bookings")
      .select("id, passenger_phone")
      .in("id", recentIds);

    for (const row of phoneRows ?? []) {
      if (row.passenger_phone) phoneByBookingId.set(row.id, row.passenger_phone);
    }

    const missingIds = recentIds.filter((id) => !phoneByBookingId.has(id));
    if (missingIds.length > 0) {
      const { data: contactLogs } = await supabase
        .from("audit_logs")
        .select("entity_id, metadata")
        .eq("entity_type", "booking")
        .eq("action", "booking_contact")
        .in("entity_id", missingIds);

      for (const log of contactLogs ?? []) {
        const phone = (log.metadata as { passenger_phone?: string } | null)
          ?.passenger_phone;
        if (phone && log.entity_id) phoneByBookingId.set(log.entity_id, phone);
      }
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="text-slate-500">Overview of transport operations (last 30 days)</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ title, value, icon: Icon, format }) => (
          <Card key={title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                {title}
              </CardTitle>
              <Icon className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{format(Number(value))}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg">Recent Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          {(recentBookings ?? []).length === 0 ? (
            <p className="text-sm text-slate-500">No bookings yet.</p>
          ) : (
            <div className="space-y-3">
              {recentBookings?.map((b) => {
                const schedule = unwrapRelation(b.schedule);
                const route = unwrapRelation(schedule?.route);
                return (
                <div
                  key={b.id}
                  className="flex justify-between border-b border-slate-100 pb-2 text-sm"
                >
                  <span>
                    {route?.origin} → {route?.destination}
                    {phoneByBookingId.get(b.id) ? (
                      <span className="block text-xs text-slate-400">
                        {phoneByBookingId.get(b.id)}
                      </span>
                    ) : null}
                  </span>
                  <span className="text-slate-500">
                    {formatCurrency(b.total_amount)} · {b.status}
                  </span>
                </div>
              );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

