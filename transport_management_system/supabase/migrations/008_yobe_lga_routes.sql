-- Within-Yobe LGA routes + route_scope column

DO $$ BEGIN
  CREATE TYPE route_scope AS ENUM ('within_yobe', 'outside_yobe');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE routes
  ADD COLUMN IF NOT EXISTS route_scope route_scope NOT NULL DEFAULT 'outside_yobe';

UPDATE routes SET route_scope = 'outside_yobe' WHERE origin = 'Yobe';

-- Hub routes: Damaturu & Potiskum to every LGA
INSERT INTO routes (company_id, origin, destination, route_scope, distance_km, base_fare)
SELECT
  '11111111-1111-1111-1111-111111111111',
  hub.origin,
  lga.dest,
  'within_yobe',
  CASE
    WHEN hub.origin = lga.dest THEN 5
    ELSE 40 + (random() * 80)::int
  END,
  CASE
    WHEN hub.origin = lga.dest THEN 500
    ELSE 1500 + (random() * 2500)::int
  END
FROM (VALUES ('Damaturu'), ('Potiskum')) AS hub(origin)
CROSS JOIN (
  VALUES
    ('Bade'), ('Bursari'), ('Damaturu'), ('Fika'), ('Fune'),
    ('Geidam'), ('Gujba'), ('Gulani'), ('Jakusko'), ('Karasuwa'),
    ('Machina'), ('Nangere'), ('Nguru'), ('Potiskum'), ('Tarmuwa'),
    ('Yunusari'), ('Yusufari')
) AS lga(dest)
WHERE hub.origin <> lga.dest
ON CONFLICT (company_id, origin, destination) DO UPDATE SET
  route_scope = EXCLUDED.route_scope;

-- Popular cross-LGA routes
INSERT INTO routes (company_id, origin, destination, route_scope, distance_km, base_fare) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Nguru', 'Geidam', 'within_yobe', 55, 2200),
  ('11111111-1111-1111-1111-111111111111', 'Gujba', 'Damaturu', 'within_yobe', 45, 1800),
  ('11111111-1111-1111-1111-111111111111', 'Gujba', 'Potiskum', 'within_yobe', 35, 1500),
  ('22222222-2222-2222-2222-222222222222', 'Damaturu', 'Gujba', 'within_yobe', 45, 1750),
  ('22222222-2222-2222-2222-222222222222', 'Damaturu', 'Nguru', 'within_yobe', 90, 3200),
  ('22222222-2222-2222-2222-222222222222', 'Potiskum', 'Damaturu', 'within_yobe', 50, 2000)
ON CONFLICT (company_id, origin, destination) DO UPDATE SET
  route_scope = EXCLUDED.route_scope;

-- Schedules for within-Yobe LGA routes (next 7 days)
INSERT INTO schedules (route_id, bus_id, departure_at, arrival_at, status)
SELECT
  r.id,
  b.id,
  (CURRENT_DATE + d.day_offset + depart.time_slot)::TIMESTAMPTZ,
  (CURRENT_DATE + d.day_offset + depart.time_slot + (r.distance_km / 40) * INTERVAL '1 hour')::TIMESTAMPTZ,
  'scheduled'
FROM routes r
JOIN buses b ON b.company_id = r.company_id
  AND b.vehicle_type IN ('golf', 'sienna', 'sharon')
CROSS JOIN generate_series(0, 6) AS d(day_offset)
CROSS JOIN (VALUES (TIME '07:00'), (TIME '11:00'), (TIME '15:00')) AS depart(time_slot)
WHERE r.route_scope = 'within_yobe'
  AND NOT EXISTS (
    SELECT 1 FROM schedules s
    WHERE s.route_id = r.id
      AND s.bus_id = b.id
      AND s.departure_at = (CURRENT_DATE + d.day_offset + depart.time_slot)::TIMESTAMPTZ
  );
