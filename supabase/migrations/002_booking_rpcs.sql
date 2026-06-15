-- Booking RPCs and utility functions

-- Expire stale seat holds
CREATE OR REPLACE FUNCTION expire_stale_holds()
RETURNS INTEGER AS $$
DECLARE
  affected INTEGER;
BEGIN
  UPDATE seats
  SET status = 'available', held_by = NULL, hold_expires_at = NULL
  WHERE status = 'held' AND hold_expires_at < NOW();

  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Hold seats for 10 minutes
CREATE OR REPLACE FUNCTION hold_seats(
  p_schedule_id UUID,
  p_seat_ids UUID[],
  p_user_id UUID
)
RETURNS TABLE(hold_id UUID, expires_at TIMESTAMPTZ) AS $$
DECLARE
  v_hold_id UUID := gen_random_uuid();
  v_expires TIMESTAMPTZ := NOW() + INTERVAL '10 minutes';
  v_seat_id UUID;
  v_count INTEGER;
BEGIN
  PERFORM expire_stale_holds();

  SELECT COUNT(*) INTO v_count
  FROM seats
  WHERE id = ANY(p_seat_ids)
    AND schedule_id = p_schedule_id
    AND status = 'available';

  IF v_count != array_length(p_seat_ids, 1) THEN
    RAISE EXCEPTION 'One or more seats are not available';
  END IF;

  FOREACH v_seat_id IN ARRAY p_seat_ids LOOP
    UPDATE seats
    SET status = 'held', held_by = p_user_id, hold_expires_at = v_expires
    WHERE id = v_seat_id AND schedule_id = p_schedule_id AND status = 'available';

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Seat % could not be held', v_seat_id;
    END IF;
  END LOOP;

  hold_id := v_hold_id;
  expires_at := v_expires;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Confirm booking after payment
CREATE OR REPLACE FUNCTION confirm_booking(
  p_schedule_id UUID,
  p_seat_ids UUID[],
  p_user_id UUID,
  p_payment_ref TEXT,
  p_amount NUMERIC,
  p_provider TEXT DEFAULT 'mock'
)
RETURNS TABLE(booking_id UUID, ticket_code TEXT) AS $$
DECLARE
  v_booking_id UUID;
  v_ticket_code TEXT;
  v_qr_payload TEXT;
  v_seat_id UUID;
  v_existing_booking UUID;
BEGIN
  -- Idempotent: if payment ref exists, return existing booking
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

  -- Verify seats are held by user or available
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

  INSERT INTO bookings (user_id, schedule_id, status, total_amount)
  VALUES (p_user_id, p_schedule_id, 'confirmed', p_amount)
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

-- Cancel booking
CREATE OR REPLACE FUNCTION cancel_booking(
  p_booking_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_booking RECORD;
  v_seat RECORD;
BEGIN
  SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  IF v_booking.user_id != p_user_id AND NOT is_admin_or_staff() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF v_booking.status = 'cancelled' THEN
    RETURN TRUE;
  END IF;

  IF v_booking.status != 'confirmed' THEN
    RAISE EXCEPTION 'Only confirmed bookings can be cancelled';
  END IF;

  -- Release seats
  FOR v_seat IN
    SELECT bs.seat_id FROM booking_seats bs WHERE bs.booking_id = p_booking_id
  LOOP
    UPDATE seats SET status = 'available', held_by = NULL, hold_expires_at = NULL
    WHERE id = v_seat.seat_id;
  END LOOP;

  UPDATE bookings SET status = 'cancelled' WHERE id = p_booking_id;

  UPDATE payments SET status = 'refunded'
  WHERE booking_id = p_booking_id AND status = 'success';

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Dashboard stats
CREATE OR REPLACE FUNCTION get_dashboard_stats(
  p_company_id UUID DEFAULT NULL,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE(
  total_bookings BIGINT,
  total_revenue NUMERIC,
  active_routes BIGINT,
  occupancy_rate NUMERIC
) AS $$
DECLARE
  v_total_seats BIGINT;
  v_booked_seats BIGINT;
BEGIN
  SELECT COUNT(*) INTO total_bookings
  FROM bookings b
  JOIN schedules s ON s.id = b.schedule_id
  JOIN routes r ON r.id = s.route_id
  WHERE b.status = 'confirmed'
    AND b.created_at >= NOW() - (p_days || ' days')::INTERVAL
    AND (p_company_id IS NULL OR r.company_id = p_company_id);

  SELECT COALESCE(SUM(p.amount), 0) INTO total_revenue
  FROM payments p
  JOIN bookings b ON b.id = p.booking_id
  JOIN schedules s ON s.id = b.schedule_id
  JOIN routes r ON r.id = s.route_id
  WHERE p.status = 'success'
    AND p.created_at >= NOW() - (p_days || ' days')::INTERVAL
    AND (p_company_id IS NULL OR r.company_id = p_company_id);

  SELECT COUNT(DISTINCT r.id) INTO active_routes
  FROM routes r
  JOIN schedules s ON s.route_id = r.id
  WHERE s.departure_at >= NOW()
    AND s.status = 'scheduled'
    AND (p_company_id IS NULL OR r.company_id = p_company_id);

  SELECT COUNT(*) INTO v_total_seats
  FROM seats st
  JOIN schedules s ON s.id = st.schedule_id
  JOIN routes r ON r.id = s.route_id
  WHERE s.departure_at >= NOW() - (p_days || ' days')::INTERVAL
    AND (p_company_id IS NULL OR r.company_id = p_company_id);

  SELECT COUNT(*) INTO v_booked_seats
  FROM seats st
  JOIN schedules s ON s.id = st.schedule_id
  JOIN routes r ON r.id = s.route_id
  WHERE st.status = 'booked'
    AND s.departure_at >= NOW() - (p_days || ' days')::INTERVAL
    AND (p_company_id IS NULL OR r.company_id = p_company_id);

  occupancy_rate := CASE WHEN v_total_seats > 0
    THEN ROUND((v_booked_seats::NUMERIC / v_total_seats) * 100, 1)
    ELSE 0 END;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION hold_seats TO authenticated;
GRANT EXECUTE ON FUNCTION confirm_booking TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_booking TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_stats TO authenticated;
GRANT EXECUTE ON FUNCTION expire_stale_holds TO authenticated;
