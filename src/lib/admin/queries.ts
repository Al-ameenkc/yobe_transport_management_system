import { getAdminClient } from "@/lib/admin/session";
import { getPageRange, parsePageParam } from "@/lib/admin/pagination";
import { unwrapRelation } from "@/lib/supabase/helpers";

export interface AdminBookingRow {
  id: string;
  user_id: string;
  status: string;
  total_amount: number;
  created_at: string;
  passengerName: string;
  ticketCode: string | null;
  origin: string;
  destination: string;
  departureAt: string;
}

async function findBookingIdsForSearch(q: string): Promise<string[]> {
  const supabase = await getAdminClient();
  const term = `%${q}%`;
  const ids = new Set<string>();

  const { data: tickets } = await supabase
    .from("tickets")
    .select("booking_id")
    .ilike("ticket_code", term);
  tickets?.forEach((t) => ids.add(t.booking_id));

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id")
    .ilike("full_name", term);
  if (profiles?.length) {
    const { data: userBookings } = await supabase
      .from("bookings")
      .select("id")
      .in(
        "user_id",
        profiles.map((p) => p.id)
      );
    userBookings?.forEach((b) => ids.add(b.id));
  }

  const { data: schedules } = await supabase
    .from("schedules")
    .select("id, route:routes(origin, destination)");
  for (const schedule of schedules ?? []) {
    const route = unwrapRelation(schedule.route);
    const haystack = `${route?.origin ?? ""} ${route?.destination ?? ""}`.toLowerCase();
    if (haystack.includes(q.toLowerCase())) {
      const { data: scheduleBookings } = await supabase
        .from("bookings")
        .select("id")
        .eq("schedule_id", schedule.id);
      scheduleBookings?.forEach((b) => ids.add(b.id));
    }
  }

  const { data: buses } = await supabase
    .from("buses")
    .select("id, plate_number, model")
    .or(`plate_number.ilike.${term},model.ilike.${term}`);
  if (buses?.length) {
    const busIds = buses.map((b) => b.id);
    const { data: busSchedules } = await supabase
      .from("schedules")
      .select("id")
      .in("bus_id", busIds);
    if (busSchedules?.length) {
      const scheduleIds = busSchedules.map((s) => s.id);
      const { data: busBookings } = await supabase
        .from("bookings")
        .select("id")
        .in("schedule_id", scheduleIds);
      busBookings?.forEach((b) => ids.add(b.id));
    }
  }

  return Array.from(ids);
}

export async function getAdminBookings(options: {
  q?: string;
  status?: string;
  page?: string;
}) {
  const supabase = await getAdminClient();
  const page = parsePageParam(options.page);
  const { from, to } = getPageRange(page);

  let bookingIds: string[] | null = null;
  if (options.q?.trim()) {
    bookingIds = await findBookingIdsForSearch(options.q.trim());
    if (bookingIds.length === 0) {
      return { bookings: [], total: 0, page, error: null };
    }
  }

  let query = supabase
    .from("bookings")
    .select(
      `
      id,
      user_id,
      status,
      total_amount,
      created_at,
      schedule:schedules(departure_at, route:routes(origin, destination)),
      ticket:tickets(ticket_code)
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (options.status) {
    query = query.eq("status", options.status);
  }
  if (bookingIds) {
    query = query.in("id", bookingIds);
  }

  const { data, error, count } = await query.range(from, to);

  const userIds = [...new Set((data ?? []).map((b) => b.user_id))];
  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", userIds)
    : { data: [] };

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  const bookings: AdminBookingRow[] = (data ?? []).map((b) => {
    const schedule = unwrapRelation(b.schedule);
    const route = unwrapRelation(schedule?.route);
    const ticket = unwrapRelation(b.ticket);

    return {
      id: b.id,
      user_id: b.user_id,
      status: b.status,
      total_amount: b.total_amount,
      created_at: b.created_at,
      passengerName: profileMap.get(b.user_id) ?? "Unknown passenger",
      ticketCode: ticket?.ticket_code ?? null,
      origin: route?.origin ?? "—",
      destination: route?.destination ?? "—",
      departureAt: schedule?.departure_at ?? "",
    };
  });

  return {
    bookings,
    total: count ?? 0,
    page,
    error: error?.message ?? null,
  };
}

export async function getAdminBuses(options: { q?: string; type?: string; page?: string }) {
  const supabase = await getAdminClient();
  const page = parsePageParam(options.page);
  const { from, to } = getPageRange(page);

  let query = supabase
    .from("buses")
    .select("*, company:companies(name)", { count: "exact" })
    .order("created_at", { ascending: false });

  if (options.type) {
    query = query.eq("vehicle_type", options.type);
  }
  if (options.q?.trim()) {
    const term = `%${options.q.trim()}%`;
    query = query.or(`plate_number.ilike.${term},model.ilike.${term}`);
  }

  const { data, error, count } = await query.range(from, to);
  return { buses: data ?? [], total: count ?? 0, page, error: error?.message ?? null };
}

export async function getAdminSchedules(options: { q?: string; status?: string; page?: string }) {
  const supabase = await getAdminClient();
  const page = parsePageParam(options.page);
  const { from, to } = getPageRange(page);

  let query = supabase
    .from("schedules")
    .select(
      `
      *,
      route:routes(origin, destination, company:companies(name)),
      bus:buses(plate_number, vehicle_type)
    `
    )
    .order("departure_at", { ascending: true });

  if (options.status) {
    query = query.eq("status", options.status);
  }

  const { data, error } = await query;

  let schedules = data ?? [];
  if (options.q?.trim()) {
    const q = options.q.trim().toLowerCase();
    schedules = schedules.filter((s) => {
      const route = unwrapRelation(s.route);
      const bus = unwrapRelation(s.bus);
      const company = unwrapRelation(route?.company);
      const haystack = [
        route?.origin,
        route?.destination,
        company?.name,
        bus?.plate_number,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }

  const total = schedules.length;
  const paginated = schedules.slice(from, to + 1);

  return {
    schedules: paginated,
    total,
    page,
    error: error?.message ?? null,
  };
}
