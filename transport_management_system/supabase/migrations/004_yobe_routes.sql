-- Migration: add Yobe routes (safe — does not delete existing data)
-- Run in Supabase SQL Editor to add Yobe routes alongside existing data

INSERT INTO routes (company_id, origin, destination, distance_km, base_fare) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Yobe', 'Abuja', 720, 14000),
  ('11111111-1111-1111-1111-111111111111', 'Yobe', 'Jos', 480, 9500),
  ('11111111-1111-1111-1111-111111111111', 'Yobe', 'Bauchi', 320, 7000),
  ('11111111-1111-1111-1111-111111111111', 'Yobe', 'Kano', 380, 8000),
  ('11111111-1111-1111-1111-111111111111', 'Yobe', 'Kaduna', 520, 10000),
  ('11111111-1111-1111-1111-111111111111', 'Yobe', 'Nasarawa', 650, 12000),
  ('11111111-1111-1111-1111-111111111111', 'Yobe', 'Niger', 780, 14500),
  ('11111111-1111-1111-1111-111111111111', 'Yobe', 'Sokoto', 420, 8500),
  ('11111111-1111-1111-1111-111111111111', 'Yobe', 'Zamfara', 350, 7500),
  ('22222222-2222-2222-2222-222222222222', 'Yobe', 'Abuja', 720, 13500),
  ('22222222-2222-2222-2222-222222222222', 'Yobe', 'Kano', 380, 7800),
  ('22222222-2222-2222-2222-222222222222', 'Yobe', 'Kaduna', 520, 9800)
ON CONFLICT (company_id, origin, destination) DO NOTHING;

UPDATE buses SET plate_number = 'YBE-101-AA', model = 'Toyota Coaster' WHERE plate_number = 'LAG-123-AB';
UPDATE buses SET plate_number = 'YBE-202-BB', model = 'Mercedes Sprinter' WHERE plate_number = 'LAG-456-CD';
UPDATE buses SET plate_number = 'YBE-303-CC', model = 'Toyota Hiace' WHERE plate_number = 'ABJ-789-EF';

UPDATE companies SET name = 'Yobe Line Transport' WHERE id = '11111111-1111-1111-1111-111111111111';
UPDATE companies SET name = 'Damaturu Express' WHERE id = '22222222-2222-2222-2222-222222222222';

INSERT INTO schedules (route_id, bus_id, departure_at, arrival_at, status)
SELECT
  r.id,
  b.id,
  (CURRENT_DATE + d.day_offset + depart.time_slot)::TIMESTAMPTZ,
  (CURRENT_DATE + d.day_offset + depart.time_slot + (r.distance_km / 60) * INTERVAL '1 hour')::TIMESTAMPTZ,
  'scheduled'
FROM routes r
JOIN buses b ON b.company_id = r.company_id
CROSS JOIN generate_series(0, 6) AS d(day_offset)
CROSS JOIN (VALUES (TIME '06:00'), (TIME '14:00')) AS depart(time_slot)
WHERE r.origin = 'Yobe';
