-- Seed data: Yobe State inter-state transport

INSERT INTO companies (id, name, email, phone) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Yobe Line Transport', 'info@yobeline.ng', '+2348012345678'),
  ('22222222-2222-2222-2222-222222222222', 'Damaturu Express', 'contact@damaturuexpress.ng', '+2348098765432')
ON CONFLICT (id) DO NOTHING;

-- Requires vehicle_type enum from 005_vehicle_types.sql when run on fresh DB
INSERT INTO buses (company_id, plate_number, model, vehicle_type, capacity, seat_layout, status) VALUES
  ('11111111-1111-1111-1111-111111111111', 'YBE-BUS-01', 'Toyota Bus', 'bus', 18,
   '{"vehicleType":"bus","seatNumbers":["F1","F2","1A","1B","1C","1D","2A","2B","2C","2D","3A","3B","3C","3D","4A","4B","4C","4D"]}', 'active'),
  ('11111111-1111-1111-1111-111111111111', 'YBE-SIE-01', 'Sienna', 'sienna', 9,
   '{"vehicleType":"sienna","seatNumbers":["F1","F2","M1","M2","M3","M4","B1","B2","B3"]}', 'active'),
  ('11111111-1111-1111-1111-111111111111', 'YBE-SHA-01', 'Sharon', 'sharon', 9,
   '{"vehicleType":"sharon","seatNumbers":["F1","F2","M1","M2","M3","M4","B1","B2","B3"]}', 'active'),
  ('11111111-1111-1111-1111-111111111111', 'YBE-GLF-01', 'Golf', 'golf', 6,
   '{"vehicleType":"golf","seatNumbers":["F1","F2","1A","1B","1C","1D"]}', 'active'),
  ('22222222-2222-2222-2222-222222222222', 'YBE-BUS-02', 'Toyota Bus', 'bus', 18,
   '{"vehicleType":"bus","seatNumbers":["F1","F2","1A","1B","1C","1D","2A","2B","2C","2D","3A","3B","3C","3D","4A","4B","4C","4D"]}', 'active'),
  ('22222222-2222-2222-2222-222222222222', 'YBE-SIE-02', 'Sienna', 'sienna', 9,
   '{"vehicleType":"sienna","seatNumbers":["F1","F2","M1","M2","M3","M4","B1","B2","B3"]}', 'active')
ON CONFLICT (plate_number) DO NOTHING;

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

INSERT INTO schedules (route_id, bus_id, departure_at, arrival_at, status)
SELECT
  r.id,
  b.id,
  (CURRENT_DATE + d.day_offset + depart.time_slot)::TIMESTAMPTZ,
  (CURRENT_DATE + d.day_offset + depart.time_slot + (r.distance_km / 55) * INTERVAL '1 hour')::TIMESTAMPTZ,
  'scheduled'
FROM routes r
JOIN buses b ON b.company_id = r.company_id
CROSS JOIN generate_series(0, 6) AS d(day_offset)
CROSS JOIN (VALUES (TIME '06:00'), (TIME '10:00'), (TIME '14:00')) AS depart(time_slot)
WHERE r.origin = 'Yobe';

INSERT INTO drivers (company_id, full_name, license_number, phone) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Musa Ibrahim', 'YB-DL-001', '+2347011111111'),
  ('11111111-1111-1111-1111-111111111111', 'Fatima Abubakar', 'YB-DL-002', '+2347022222222'),
  ('22222222-2222-2222-2222-222222222222', 'Aliyu Mohammed', 'YB-DL-003', '+2347033333333');
