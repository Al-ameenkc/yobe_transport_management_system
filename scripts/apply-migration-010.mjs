/**
 * Inserts LGA → state interstate routes using the service role key in .env.local
 * Usage: node scripts/apply-migration-010.mjs
 */
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "../.env.local");
const env = Object.fromEntries(
  readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const idx = line.indexOf("=");
      return [line.slice(0, idx), line.slice(idx + 1)];
    })
);

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

const towns = [
  "Bade",
  "Bursari",
  "Damaturu",
  "Fika",
  "Fune",
  "Geidam",
  "Gashua",
  "Gujba",
  "Gulani",
  "Jakusko",
  "Karasuwa",
  "Machina",
  "Nangere",
  "Nguru",
  "Potiskum",
  "Tarmuwa",
  "Yunusari",
  "Yusufari",
];

const { data: statewide, error: loadError } = await supabase
  .from("routes")
  .select("company_id, destination, distance_km, base_fare")
  .eq("origin", "Yobe")
  .eq("route_scope", "outside_yobe");

if (loadError) {
  console.error(loadError.message);
  process.exit(1);
}

const rows = [];
for (const route of statewide ?? []) {
  for (const origin of towns) {
    rows.push({
      company_id: route.company_id,
      origin,
      destination: route.destination,
      route_scope: "outside_yobe",
      distance_km: route.distance_km,
      base_fare: route.base_fare,
    });
  }
}

const { error: insertError } = await supabase.from("routes").upsert(rows, {
  onConflict: "company_id,origin,destination",
  ignoreDuplicates: true,
});

if (insertError) {
  console.error(insertError.message);
  process.exit(1);
}

const localRows = [
  {
    company_id: "11111111-1111-1111-1111-111111111111",
    origin: "Damaturu",
    destination: "Gashua",
    route_scope: "within_yobe",
    distance_km: 95,
    base_fare: 3500,
  },
  {
    company_id: "11111111-1111-1111-1111-111111111111",
    origin: "Potiskum",
    destination: "Gashua",
    route_scope: "within_yobe",
    distance_km: 95,
    base_fare: 3500,
  },
  {
    company_id: "11111111-1111-1111-1111-111111111111",
    origin: "Gashua",
    destination: "Damaturu",
    route_scope: "within_yobe",
    distance_km: 95,
    base_fare: 3500,
  },
  {
    company_id: "11111111-1111-1111-1111-111111111111",
    origin: "Gashua",
    destination: "Potiskum",
    route_scope: "within_yobe",
    distance_km: 95,
    base_fare: 3500,
  },
];

await supabase.from("routes").upsert(localRows, {
  onConflict: "company_id,origin,destination",
  ignoreDuplicates: true,
});

console.log(`Upserted ${rows.length} interstate town routes plus Gashua local links.`);
