-- E-Logistics TMS Initial Schema

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE user_role AS ENUM ('passenger', 'staff', 'admin');
CREATE TYPE seat_status AS ENUM ('available', 'held', 'booked');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled');
CREATE TYPE schedule_status AS ENUM ('scheduled', 'departed', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'success', 'failed', 'refunded');
CREATE TYPE bus_status AS ENUM ('active', 'maintenance', 'inactive');

-- Companies
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'passenger',
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Buses
CREATE TABLE buses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  plate_number TEXT NOT NULL UNIQUE,
  model TEXT,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  seat_layout JSONB NOT NULL DEFAULT '{"rows": 10, "cols": 4, "aisleAfterCol": 2}',
  status bus_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Routes
CREATE TABLE routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  distance_km NUMERIC(10,2) NOT NULL,
  base_fare NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, origin, destination)
);

-- Schedules
CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  bus_id UUID NOT NULL REFERENCES buses(id) ON DELETE RESTRICT,
  departure_at TIMESTAMPTZ NOT NULL,
  arrival_at TIMESTAMPTZ NOT NULL,
  fare_override NUMERIC(12,2),
  status schedule_status NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (arrival_at > departure_at)
);

-- Seats (per schedule)
CREATE TABLE seats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  seat_number TEXT NOT NULL,
  status seat_status NOT NULL DEFAULT 'available',
  held_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  hold_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(schedule_id, seat_number)
);

-- Bookings
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE RESTRICT,
  status booking_status NOT NULL DEFAULT 'pending',
  total_amount NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Booking seats junction
CREATE TABLE booking_seats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  seat_id UUID NOT NULL REFERENCES seats(id) ON DELETE RESTRICT,
  UNIQUE(booking_id, seat_id),
  UNIQUE(seat_id)
);

-- Tickets
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE UNIQUE,
  ticket_code TEXT NOT NULL UNIQUE,
  qr_payload TEXT NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  reference TEXT NOT NULL UNIQUE,
  amount NUMERIC(12,2) NOT NULL,
  status payment_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Drivers
CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  license_number TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_schedules_departure ON schedules(departure_at);
CREATE INDEX idx_schedules_route ON schedules(route_id);
CREATE INDEX idx_seats_schedule ON seats(schedule_id);
CREATE INDEX idx_seats_status ON seats(status);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_routes_origin_dest ON routes(origin, destination);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;
GRANT ALL ON TABLE public.profiles TO supabase_auth_admin;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Generate seats when schedule is created
CREATE OR REPLACE FUNCTION generate_seats_for_schedule()
RETURNS TRIGGER AS $$
DECLARE
  bus_record RECORD;
  layout JSONB;
  r INTEGER;
  c INTEGER;
  seat_num TEXT;
  total INTEGER;
  counter INTEGER := 0;
BEGIN
  SELECT * INTO bus_record FROM buses WHERE id = NEW.bus_id;
  layout := bus_record.seat_layout;
  total := bus_record.capacity;

  FOR r IN 1..(layout->>'rows')::INTEGER LOOP
    FOR c IN 1..(layout->>'cols')::INTEGER LOOP
      EXIT WHEN counter >= total;
      seat_num := r || chr(64 + c);
      INSERT INTO seats (schedule_id, seat_number) VALUES (NEW.id, seat_num);
      counter := counter + 1;
    END LOOP;
    EXIT WHEN counter >= total;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_schedule_created
  AFTER INSERT ON schedules
  FOR EACH ROW EXECUTE FUNCTION generate_seats_for_schedule();

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE buses ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper: check if user is admin/staff
CREATE OR REPLACE FUNCTION is_admin_or_staff()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('admin', 'staff')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- RLS Policies
CREATE POLICY "Public read companies" ON companies FOR SELECT USING (true);
CREATE POLICY "Admin manage companies" ON companies FOR ALL USING (is_admin());

CREATE POLICY "Users read own profile" ON profiles FOR SELECT USING (auth.uid() = id OR is_admin_or_staff());
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Allow profile creation on signup" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Admin manage profiles" ON profiles FOR ALL USING (is_admin());

CREATE POLICY "Public read buses" ON buses FOR SELECT USING (true);
CREATE POLICY "Staff manage company buses" ON buses FOR ALL USING (is_admin_or_staff());

CREATE POLICY "Public read routes" ON routes FOR SELECT USING (true);
CREATE POLICY "Staff manage routes" ON routes FOR ALL USING (is_admin_or_staff());

CREATE POLICY "Public read schedules" ON schedules FOR SELECT USING (true);
CREATE POLICY "Staff manage schedules" ON schedules FOR ALL USING (is_admin_or_staff());

CREATE POLICY "Public read seats" ON seats FOR SELECT USING (true);
CREATE POLICY "Authenticated update seats" ON seats FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users read own bookings" ON bookings FOR SELECT USING (auth.uid() = user_id OR is_admin_or_staff());
CREATE POLICY "Users create bookings" ON bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Staff manage bookings" ON bookings FOR ALL USING (is_admin_or_staff());

CREATE POLICY "Users read own booking seats" ON booking_seats FOR SELECT USING (
  EXISTS (SELECT 1 FROM bookings b WHERE b.id = booking_id AND (b.user_id = auth.uid() OR is_admin_or_staff()))
);
CREATE POLICY "Users insert booking seats" ON booking_seats FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM bookings b WHERE b.id = booking_id AND b.user_id = auth.uid())
);

CREATE POLICY "Users read own tickets" ON tickets FOR SELECT USING (
  EXISTS (SELECT 1 FROM bookings b WHERE b.id = booking_id AND (b.user_id = auth.uid() OR is_admin_or_staff()))
);

CREATE POLICY "Users read own payments" ON payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM bookings b WHERE b.id = booking_id AND (b.user_id = auth.uid() OR is_admin_or_staff()))
);
CREATE POLICY "Staff manage payments" ON payments FOR ALL USING (is_admin_or_staff());

CREATE POLICY "Public read drivers" ON drivers FOR SELECT USING (true);
CREATE POLICY "Staff manage drivers" ON drivers FOR ALL USING (is_admin_or_staff());

CREATE POLICY "Admin read audit logs" ON audit_logs FOR SELECT USING (is_admin());
CREATE POLICY "System insert audit logs" ON audit_logs FOR INSERT WITH CHECK (true);
