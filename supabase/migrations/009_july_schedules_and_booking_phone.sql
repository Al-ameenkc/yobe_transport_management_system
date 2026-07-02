-- Passenger contact phone on bookings (for no-show follow-up calls)
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS passenger_phone TEXT;

-- Replace confirm_booking (drop old 6-arg overload so GRANT is unambiguous)
DROP FUNCTION IF EXISTS public.confirm_booking(UUID, UUID[], UUID, TEXT, NUMERIC, TEXT);
DROP FUNCTION IF EXISTS public.confirm_booking(UUID, UUID[], UUID, TEXT, NUMERIC, TEXT, TEXT);

-- Confirm booking after ticket issuance (supports offline / pay-at-terminal flow)
CREATE OR REPLACE FUNCTION confirm_booking(
  p_schedule_id UUID,
  p_seat_ids UUID[],
  p_user_id UUID,
  p_payment_ref TEXT,
  p_amount NUMERIC,
  p_provider TEXT DEFAULT 'offline',
  p_passenger_phone TEXT DEFAULT NULL
)
RETURNS TABLE(booking_id UUID, ticket_code TEXT) AS $$
DECLARE
  v_booking_id UUID;
  v_ticket_code TEXT;
  v_qr_payload TEXT;
  v_seat_id UUID;
  v_existing_booking UUID;
BEGIN
  SELECT b.id INTO v_existing_booking
  FROM payments p
  JOIN bookings b ON b.id = p.booking_id
  WHERE p.reference = p_payment_ref AND p.status = 'success';

  IF v_existing_booking IS NOT NULL THEN
    SELECT t.ticket_code INTO v_ticket_code FROM tickets t WHERE t.booking_id = v_existing_booking;
    booking_id := v_existing_booking;
    ticket_code := v_ticket_code;
    RETURN NEXT;
    RETURN;
  END IF;

  PERFORM expire_stale_holds();

  IF EXISTS (
    SELECT 1 FROM seats
    WHERE id = ANY(p_seat_ids)
      AND schedule_id = p_schedule_id
      AND NOT (
        (status = 'held' AND held_by = p_user_id AND hold_expires_at > NOW())
        OR status = 'available'
      )
  ) THEN
    RAISE EXCEPTION 'Seats are no longer available';
  END IF;

  INSERT INTO bookings (user_id, schedule_id, status, total_amount, passenger_phone)
  VALUES (p_user_id, p_schedule_id, 'confirmed', p_amount, NULLIF(TRIM(p_passenger_phone), ''))
  RETURNING id INTO v_booking_id;

  FOREACH v_seat_id IN ARRAY p_seat_ids LOOP
    UPDATE seats
    SET status = 'booked', held_by = NULL, hold_expires_at = NULL
    WHERE id = v_seat_id;

    INSERT INTO booking_seats (booking_id, seat_id)
    VALUES (v_booking_id, v_seat_id);
  END LOOP;

  v_ticket_code := 'TMS-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
  v_qr_payload := json_build_object(
    'ticket_code', v_ticket_code,
    'booking_id', v_booking_id,
    'schedule_id', p_schedule_id
  )::text;

  INSERT INTO tickets (booking_id, ticket_code, qr_payload)
  VALUES (v_booking_id, v_ticket_code, v_qr_payload);

  INSERT INTO payments (booking_id, provider, reference, amount, status)
  VALUES (v_booking_id, p_provider, p_payment_ref, p_amount, 'success');

  booking_id := v_booking_id;
  ticket_code := v_ticket_code;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION confirm_booking(UUID, UUID[], UUID, TEXT, NUMERIC, TEXT, TEXT) TO authenticated;

-- July 2–10, 2026 trip schedules: mixed routes, mixed vehicles, 2+ buses per route
INSERT INTO schedules (route_id, bus_id, departure_at, arrival_at, status)
SELECT
  r.id,
  b.id,
  (DATE '2026-07-02' + d.day_offset + pairing.depart_time)::TIMESTAMPTZ,
  (
    DATE '2026-07-02' + d.day_offset + pairing.depart_time
    + (
      r.distance_km / CASE WHEN r.route_scope = 'within_yobe' THEN 40.0 ELSE 55.0 END
    ) * INTERVAL '1 hour'
  )::TIMESTAMPTZ,
  'scheduled'
FROM generate_series(0, 8) AS d(day_offset)
CROSS JOIN (
  VALUES
    ('Yobe', 'Abuja', 'YBE-BUS-01', TIME '06:00'),
    ('Yobe', 'Abuja', 'YBE-SIE-01', TIME '14:00'),
    ('Yobe', 'Kano', 'YBE-BUS-02', TIME '06:00'),
    ('Yobe', 'Kano', 'YBE-SIE-02', TIME '10:00'),
    ('Yobe', 'Jos', 'YBE-BUS-01', TIME '10:00'),
    ('Yobe', 'Jos', 'YBE-SHA-01', TIME '14:00'),
    ('Yobe', 'Bauchi', 'YBE-BUS-02', TIME '14:00'),
    ('Yobe', 'Bauchi', 'YBE-SIE-01', TIME '06:00'),
    ('Yobe', 'Kaduna', 'YBE-BUS-01', TIME '14:00'),
    ('Yobe', 'Kaduna', 'YBE-SIE-02', TIME '06:00'),
    ('Damaturu', 'Gujba', 'YBE-GLF-01', TIME '07:00'),
    ('Damaturu', 'Gujba', 'YBE-SIE-01', TIME '11:00'),
    ('Damaturu', 'Nguru', 'YBE-SIE-02', TIME '07:00'),
    ('Damaturu', 'Nguru', 'YBE-BUS-02', TIME '15:00'),
    ('Potiskum', 'Damaturu', 'YBE-SIE-02', TIME '07:00'),
    ('Potiskum', 'Damaturu', 'YBE-BUS-02', TIME '11:00')
) AS pairing(origin, destination, plate_number, depart_time)
JOIN routes r
  ON r.origin = pairing.origin
 AND r.destination = pairing.destination
JOIN buses b ON b.plate_number = pairing.plate_number
WHERE NOT EXISTS (
  SELECT 1
  FROM schedules s
  WHERE s.route_id = r.id
    AND s.bus_id = b.id
    AND s.departure_at = (DATE '2026-07-02' + d.day_offset + pairing.depart_time)::TIMESTAMPTZ
);
