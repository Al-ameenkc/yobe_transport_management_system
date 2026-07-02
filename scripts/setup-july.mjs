/**
 * Seeds July 2–10, 2026 schedules via Supabase service role.
 * Run: node scripts/setup-july.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnvLocal() {
  try {
    const raw = readFileSync(join(__dirname, "../.env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // optional
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const SCHEDULE_PAIRINGS = [
  { origin: "Yobe", destination: "Abuja", plate: "YBE-BUS-01", time: "06:00" },
  { origin: "Yobe", destination: "Abuja", plate: "YBE-SIE-01", time: "14:00" },
  { origin: "Yobe", destination: "Kano", plate: "YBE-BUS-02", time: "06:00" },
  { origin: "Yobe", destination: "Kano", plate: "YBE-SIE-02", time: "10:00" },
  { origin: "Yobe", destination: "Jos", plate: "YBE-BUS-01", time: "10:00" },
  { origin: "Yobe", destination: "Jos", plate: "YBE-SHA-01", time: "14:00" },
  { origin: "Yobe", destination: "Bauchi", plate: "YBE-BUS-02", time: "14:00" },
  { origin: "Yobe", destination: "Bauchi", plate: "YBE-SIE-01", time: "06:00" },
  { origin: "Yobe", destination: "Kaduna", plate: "YBE-BUS-01", time: "14:00" },
  { origin: "Yobe", destination: "Kaduna", plate: "YBE-SIE-02", time: "06:00" },
  { origin: "Damaturu", destination: "Gujba", plate: "YBE-GLF-01", time: "07:00" },
  { origin: "Damaturu", destination: "Gujba", plate: "YBE-SIE-01", time: "11:00" },
  { origin: "Damaturu", destination: "Nguru", plate: "YBE-SIE-02", time: "07:00" },
  { origin: "Damaturu", destination: "Nguru", plate: "YBE-BUS-02", time: "15:00" },
  { origin: "Potiskum", destination: "Damaturu", plate: "YBE-SIE-02", time: "07:00" },
  { origin: "Potiskum", destination: "Damaturu", plate: "YBE-BUS-02", time: "11:00" },
];

function parseTime(time) {
  const [h, m] = time.split(":").map(Number);
  return { h, m };
}

function addHours(isoDate, hours) {
  return new Date(isoDate.getTime() + hours * 60 * 60 * 1000);
}

async function seedSchedules() {
  const { data: routes, error: routesError } = await supabase
    .from("routes")
    .select("id, origin, destination, distance_km, route_scope, company_id");

  if (routesError) throw routesError;

  const { data: buses, error: busesError } = await supabase
    .from("buses")
    .select("id, plate_number, company_id");

  if (busesError) throw busesError;

  const routeMap = new Map();
  for (const route of routes) {
    const key = `${route.origin}|${route.destination}`;
    const list = routeMap.get(key) ?? [];
    list.push(route);
    routeMap.set(key, list);
  }
  const busMap = new Map(buses.map((b) => [b.plate_number, b]));

  const toInsert = [];

  for (let day = 0; day <= 8; day++) {
    const base = new Date("2026-07-02T00:00:00.000Z");
    base.setUTCDate(base.getUTCDate() + day);

    for (const pairing of SCHEDULE_PAIRINGS) {
      const routeOptions = routeMap.get(`${pairing.origin}|${pairing.destination}`) ?? [];
      const bus = busMap.get(pairing.plate);
      const route = routeOptions.find((r) => r.company_id === bus?.company_id) ?? routeOptions[0];
      if (!route || !bus) {
        console.warn(
          `Skipping missing route/bus: ${pairing.origin}→${pairing.destination} / ${pairing.plate}`
        );
        continue;
      }

      const busId = bus.id;

      const { h, m } = parseTime(pairing.time);
      const departure = new Date(base);
      departure.setUTCHours(h, m, 0, 0);

      const speed = route.route_scope === "within_yobe" ? 40 : 55;
      const travelHours = route.distance_km / speed;
      const arrival = addHours(departure, travelHours);

      toInsert.push({
        route_id: route.id,
        bus_id: busId,
        departure_at: departure.toISOString(),
        arrival_at: arrival.toISOString(),
        status: "scheduled",
      });
    }
  }

  const { data: existing } = await supabase
    .from("schedules")
    .select("route_id, bus_id, departure_at")
    .gte("departure_at", "2026-07-02")
    .lt("departure_at", "2026-07-11");

  const existingKeys = new Set(
    (existing ?? []).map((s) => `${s.route_id}|${s.bus_id}|${s.departure_at}`)
  );

  const newRows = toInsert.filter(
    (row) => !existingKeys.has(`${row.route_id}|${row.bus_id}|${row.departure_at}`)
  );

  if (newRows.length === 0) {
    console.log("All July schedules already exist");
    return 0;
  }

  const chunkSize = 50;
  let inserted = 0;
  for (let i = 0; i < newRows.length; i += chunkSize) {
    const chunk = newRows.slice(i, i + chunkSize);
    const { error } = await supabase.from("schedules").insert(chunk);
    if (error) throw error;
    inserted += chunk.length;
  }

  return inserted;
}

try {
  const inserted = await seedSchedules();
  const { count } = await supabase
    .from("schedules")
    .select("*", { count: "exact", head: true })
    .gte("departure_at", "2026-07-02")
    .lt("departure_at", "2026-07-11");

  console.log(`Inserted ${inserted} new schedules. Total July 2–10 schedules: ${count ?? 0}`);
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
