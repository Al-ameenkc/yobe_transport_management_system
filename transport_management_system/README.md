# TMS Nigeria — E-Logistics Transport Management System

Web-based bus booking platform for Nigerian road transport. Passengers search routes, select seats, pay online, and receive e-tickets with QR codes. Admins manage buses, routes, schedules, and view analytics.

## Stack

- **Frontend/API:** Next.js 16 (App Router) + TypeScript + Tailwind CSS
- **Database/Auth:** Supabase (Postgres + Auth + RLS)
- **Hosting:** Vercel (set root directory to `transport_management_system`)
- **Payments:** Mock (dev) / Paystack (production)
- **Email:** Resend
- **AI:** OpenAI (support chat + admin insights)

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run migrations in SQL Editor (in order):
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_booking_rpcs.sql`
   - `supabase/migrations/003_fix_signup_trigger.sql` (if signup fails)
   - `supabase/migrations/004_yobe_routes.sql` (if you have old Lagos data)
   - `supabase/migrations/005_vehicle_types.sql` (Yobe fleet: bus, sienna, sharon, golf)
   - `supabase/seed.sql` (optional on fresh DB)
3. Copy Project URL and anon key

### 2. Environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your Supabase keys. Set `ADMIN_PASSWORD` for the admin dashboard. Optional: Paystack, Resend (email), Termii/Twilio (SMS), OpenAI.

### 3. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Admin dashboard

1. Add to `.env.local`:
   ```
   ADMIN_PASSWORD=your-secure-password
   ```
2. Go to **[http://localhost:3000/admin/login](http://localhost:3000/admin/login)** and enter that password.

No Supabase account or admin role is required when using the env password.

### 5. Create admin user (optional — Supabase role)

1. Register via `/register`
2. In Supabase SQL Editor:

```sql
UPDATE profiles
SET role = 'admin', company_id = '11111111-1111-1111-1111-111111111111'
WHERE id = '<your-user-uuid>';
```

## Deploy to Vercel

1. Push repo to GitHub (root = `TMS_abba`)
2. Import in Vercel → set **Root Directory** to `transport_management_system`
3. Add environment variables from `.env.example`
4. Deploy

## Project structure

```
transport_management_system/
├── src/app/          # Pages and API routes
├── src/components/   # UI, seat map, admin charts
├── src/lib/          # Supabase, booking, payments, email, AI
├── supabase/         # SQL migrations + seed data
└── types/            # TypeScript database types
```

## Features

- **Yobe-only routes:** All trips depart from Yobe to Abuja, Jos, Bauchi, Kano, Kaduna, Nasarawa, Niger, Sokoto, Zamfara
- **Vehicle types:** Toyota Bus (19), Sienna/Sharon (10), Golf (7) — filter by type; Golf & Sharon not allowed on Yobe→Abuja
- **Top-view seat maps:** Flight-style 2D layout per vehicle (uses `public/bus-top-view.png` for Toyota Bus)
- **Tickets:** Download as PDF or image; auto email + SMS ticket number on booking
- Passenger: search, seat map (real-time), mock/Paystack payment, e-ticket QR
- Admin: password-protected dashboard at `/admin/login`, buses, routes, schedules, drivers, bookings, reports
- Phase 2: email confirmations, booking history, cancellation
- Phase 3: Paystack webhooks, refunds
- Phase 4: OpenAI support chat + admin insights
