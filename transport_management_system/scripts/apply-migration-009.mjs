/**
 * Applies migration 009 to the linked Supabase project.
 * Requires DATABASE_URL (Postgres connection string from Supabase dashboard).
 *
 * Usage: DATABASE_URL="postgresql://..." node scripts/apply-migration-009.mjs
 */
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import postgres from "postgres";

const __dirname = dirname(fileURLToPath(import.meta.url));
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error(
    "Missing DATABASE_URL. Get it from Supabase → Project Settings → Database → Connection string."
  );
  process.exit(1);
}

const sql = readFileSync(
  join(__dirname, "../supabase/migrations/009_july_schedules_and_booking_phone.sql"),
  "utf8"
);

const db = postgres(databaseUrl, { ssl: "require", max: 1 });

try {
  await db.unsafe(sql);
  const [{ count }] = await db`
    SELECT COUNT(*)::int AS count
    FROM schedules
    WHERE departure_at >= '2026-07-02'
      AND departure_at < '2026-07-11'
  `;
  console.log(`Migration applied. July 2–10 schedules: ${count}`);
} finally {
  await db.end();
}
