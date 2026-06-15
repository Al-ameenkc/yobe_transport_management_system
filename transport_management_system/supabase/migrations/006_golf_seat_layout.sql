-- Fix Golf seat numbers (4 back seats in one row: 1A–1D)
UPDATE buses
SET seat_layout = '{"vehicleType":"golf","seatNumbers":["F1","F2","1A","1B","1C","1D"]}'::jsonb
WHERE vehicle_type = 'golf' OR plate_number LIKE 'YBE-GLF%';
