-- Vehicle types and Yobe fleet update

CREATE TYPE vehicle_type AS ENUM ('bus', 'sienna', 'sharon', 'golf');

ALTER TABLE buses
  ADD COLUMN IF NOT EXISTS vehicle_type vehicle_type NOT NULL DEFAULT 'bus';

-- Update seat generation to use explicit seat numbers per vehicle layout
CREATE OR REPLACE FUNCTION generate_seats_for_schedule()
RETURNS TRIGGER AS $$
DECLARE
  bus_record RECORD;
  layout JSONB;
  seat_num TEXT;
  seat_numbers JSONB;
  r INTEGER;
  c INTEGER;
  counter INTEGER := 0;
  total INTEGER;
BEGIN
  SELECT * INTO bus_record FROM buses WHERE id = NEW.bus_id;
  layout := bus_record.seat_layout;
  total := bus_record.capacity;

  IF layout ? 'seatNumbers' THEN
    FOR seat_num IN
      SELECT jsonb_array_elements_text(layout->'seatNumbers')
    LOOP
      INSERT INTO seats (schedule_id, seat_number) VALUES (NEW.id, seat_num);
    END LOOP;
  ELSE
    FOR r IN 1..COALESCE((layout->>'rows')::INTEGER, 10) LOOP
      FOR c IN 1..COALESCE((layout->>'cols')::INTEGER, 4) LOOP
        EXIT WHEN counter >= total;
        seat_num := r || chr(64 + c);
        INSERT INTO seats (schedule_id, seat_number) VALUES (NEW.id, seat_num);
        counter := counter + 1;
      END LOOP;
      EXIT WHEN counter >= total;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Yobe fleet: bus, sienna, sharon, golf
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
ON CONFLICT (plate_number) DO UPDATE SET
  model = EXCLUDED.model,
  vehicle_type = EXCLUDED.vehicle_type,
  capacity = EXCLUDED.capacity,
  seat_layout = EXCLUDED.seat_layout;

-- Schedules for next 7 days using new fleet (Yobe routes only)
INSERT INTO schedules (route_id, bus_id, departure_at, arrival_at, status)
SELECT
  r.id,
  b.id,
  (CURRENT_DATE + d.day_offset + depart.time_slot)::TIMESTAMPTZ,
  (CURRENT_DATE + d.day_offset + depart.time_slot + (r.distance_km / 55) * INTERVAL '1 hour')::TIMESTAMPTZ,
  'scheduled'
FROM routes r
JOIN buses b ON b.company_id = r.company_id
  AND b.plate_number IN ('YBE-BUS-01', 'YBE-SIE-01', 'YBE-SHA-01', 'YBE-GLF-01', 'YBE-BUS-02', 'YBE-SIE-02')
CROSS JOIN generate_series(0, 6) AS d(day_offset)
CROSS JOIN (VALUES (TIME '06:00'), (TIME '10:00'), (TIME '14:00')) AS depart(time_slot)
WHERE r.origin = 'Yobe'
  AND NOT EXISTS (
    SELECT 1 FROM schedules s
    WHERE s.route_id = r.id
      AND s.bus_id = b.id
      AND s.departure_at = (CURRENT_DATE + d.day_offset + depart.time_slot)::TIMESTAMPTZ
  );
