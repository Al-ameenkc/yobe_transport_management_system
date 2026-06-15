-- Fix bus & golf seat layouts on all Yobe fleet buses, then regenerate seats on open schedules

UPDATE buses SET
  vehicle_type = 'bus',
  capacity = 18,
  seat_layout = '{"vehicleType":"bus","seatNumbers":["F1","F2","1A","1B","1C","1D","2A","2B","2C","2D","3A","3B","3C","3D","4A","4B","4C","4D"]}'::jsonb
WHERE vehicle_type = 'bus'
   OR model ILIKE '%bus%'
   OR model ILIKE '%coaster%'
   OR model ILIKE '%sprinter%'
   OR plate_number IN ('YBE-BUS-01', 'YBE-BUS-02', 'YBE-101-AA', 'YBE-202-BB');

UPDATE buses SET
  vehicle_type = 'golf',
  capacity = 6,
  seat_layout = '{"vehicleType":"golf","seatNumbers":["F1","F2","1A","1B","1C","1D"]}'::jsonb
WHERE vehicle_type = 'golf' OR plate_number LIKE 'YBE-GLF%';

UPDATE buses SET
  vehicle_type = 'sienna',
  capacity = 9,
  seat_layout = '{"vehicleType":"sienna","seatNumbers":["F1","F2","M1","M2","M3","M4","B1","B2","B3"]}'::jsonb
WHERE vehicle_type = 'sienna' OR plate_number LIKE 'YBE-SIE%';

UPDATE buses SET
  vehicle_type = 'sharon',
  capacity = 9,
  seat_layout = '{"vehicleType":"sharon","seatNumbers":["F1","F2","M1","M2","M3","M4","B1","B2","B3"]}'::jsonb
WHERE vehicle_type = 'sharon' OR plate_number LIKE 'YBE-SHA%' OR model ILIKE '%hiace%';

-- Regenerate seats for schedules with no booked seats
DO $$
DECLARE
  rec RECORD;
  seat_num TEXT;
BEGIN
  FOR rec IN
    SELECT s.id AS schedule_id, b.seat_layout
    FROM schedules s
    JOIN buses b ON b.id = s.bus_id
    WHERE b.seat_layout ? 'seatNumbers'
  LOOP
    IF EXISTS (
      SELECT 1 FROM seats st
      WHERE st.schedule_id = rec.schedule_id AND st.status = 'booked'
    ) THEN
      CONTINUE;
    END IF;

    DELETE FROM seats WHERE schedule_id = rec.schedule_id;

    FOR seat_num IN
      SELECT jsonb_array_elements_text(rec.seat_layout->'seatNumbers')
    LOOP
      INSERT INTO seats (schedule_id, seat_number)
      VALUES (rec.schedule_id, seat_num);
    END LOOP;
  END LOOP;
END $$;
