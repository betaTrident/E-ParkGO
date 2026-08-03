-- Phase S1: capacity pools (cars / motorcycles), nullable session space, trimmed entry RPC.

-- ---------------------------------------------------------------------------
-- Schema: location capacities, vehicle type pool mapping, nullable space FK
-- ---------------------------------------------------------------------------

ALTER TABLE public.parking_locations
  ADD COLUMN IF NOT EXISTS car_capacity integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS motorcycle_capacity integer NOT NULL DEFAULT 0;

ALTER TABLE public.parking_locations
  DROP CONSTRAINT IF EXISTS parking_locations_car_capacity_nonnegative,
  DROP CONSTRAINT IF EXISTS parking_locations_motorcycle_capacity_nonnegative;

ALTER TABLE public.parking_locations
  ADD CONSTRAINT parking_locations_car_capacity_nonnegative
    CHECK (car_capacity >= 0),
  ADD CONSTRAINT parking_locations_motorcycle_capacity_nonnegative
    CHECK (motorcycle_capacity >= 0);

ALTER TABLE public.vehicle_types
  ADD COLUMN IF NOT EXISTS capacity_pool text;

UPDATE public.vehicle_types vt
SET capacity_pool = CASE vt.code
  WHEN 'CAR' THEN 'CAR'
  WHEN 'MOTO' THEN 'MOTORCYCLE'
  ELSE 'CAR'
END
WHERE vt.capacity_pool IS NULL;

ALTER TABLE public.vehicle_types
  ALTER COLUMN capacity_pool SET NOT NULL;

ALTER TABLE public.vehicle_types
  DROP CONSTRAINT IF EXISTS vehicle_types_capacity_pool_check;

ALTER TABLE public.vehicle_types
  ADD CONSTRAINT vehicle_types_capacity_pool_check
    CHECK (capacity_pool IN ('CAR', 'MOTORCYCLE'));

ALTER TABLE public.parking_sessions
  ALTER COLUMN parking_space_id DROP NOT NULL;

-- Seed capacities for pilot facility (idempotent).
UPDATE public.parking_locations pl
SET
  car_capacity = 50,
  motorcycle_capacity = 30,
  updated_at = now()
WHERE pl.id = '11111111-1111-4111-8111-111111111111';

UPDATE public.vehicle_types vt
SET
  capacity_pool = CASE vt.code
    WHEN 'CAR' THEN 'CAR'
    WHEN 'MOTO' THEN 'MOTORCYCLE'
    ELSE vt.capacity_pool
  END,
  updated_at = now()
WHERE vt.parking_location_id = '11111111-1111-4111-8111-111111111111'
  AND vt.code IN ('CAR', 'MOTO');

-- ---------------------------------------------------------------------------
-- Entry RPC: pool capacity enforcement, no required parking space
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.create_parking_entry(text, uuid, text, uuid, uuid, uuid);

CREATE OR REPLACE FUNCTION public.create_parking_entry(
  p_plate text,
  p_vehicle_type_id uuid,
  p_color text,
  p_idempotency_key uuid,
  p_correlation_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_location_id uuid;
  v_actor_id uuid;
  v_normalized_plate text;
  v_display_plate text;
  v_request jsonb;
  v_request_hash bytea;
  v_existing public.idempotency_keys%ROWTYPE;
  v_vehicle_type public.vehicle_types%ROWTYPE;
  v_pool text;
  v_car_capacity integer;
  v_motorcycle_capacity integer;
  v_capacity integer;
  v_occupied_count integer;
  v_vehicle_id uuid;
  v_rate public.parking_rates;
  v_entry_time timestamptz;
  v_session_id uuid;
  v_ticket_id uuid;
  v_ticket_number text;
  v_qr_token text;
  v_qr_hash bytea;
  v_snapshot_json jsonb;
  v_snapshot_hash bytea;
  v_response jsonb;
  v_sanitized jsonb;
  v_color text;
  v_has_idempotency boolean := false;
BEGIN
  v_location_id := private.require_active_staff();
  v_actor_id := auth.uid();
  v_normalized_plate := private.normalize_plate_number(p_plate);
  v_display_plate := upper(btrim(p_plate));
  v_color := nullif(btrim(coalesce(p_color, '')), '');

  IF p_idempotency_key IS NULL OR p_correlation_id IS NULL THEN
    RAISE EXCEPTION 'idempotency and correlation ids are required' USING ERRCODE = '22023';
  END IF;

  v_request := jsonb_build_object(
    'plate', v_normalized_plate,
    'vehicle_type_id', p_vehicle_type_id,
    'color', v_color
  );
  v_request_hash := private.hash_idempotency_request(v_request);

  PERFORM pg_advisory_xact_lock(
    hashtextextended(v_location_id::text || ':' || v_normalized_plate, 0)
  );

  SELECT ik.*
  INTO v_existing
  FROM public.idempotency_keys ik
  WHERE ik.actor_id = v_actor_id
    AND ik.operation = 'create_parking_entry'
    AND ik.key = p_idempotency_key
  FOR UPDATE;

  IF FOUND THEN
    v_has_idempotency := true;

    IF v_existing.request_hash <> v_request_hash THEN
      PERFORM private.raise_domain_error('IDEMPOTENCY_CONFLICT');
    END IF;

    IF v_existing.status = 'COMPLETED' AND v_existing.response_json IS NOT NULL THEN
      RETURN v_existing.response_json;
    END IF;
  END IF;

  SELECT vt.*
  INTO v_vehicle_type
  FROM public.vehicle_types vt
  WHERE vt.id = p_vehicle_type_id
    AND vt.parking_location_id = v_location_id
    AND vt.is_active = true;

  IF NOT FOUND THEN
    PERFORM private.raise_domain_error('SPACE_NOT_AVAILABLE');
  END IF;

  v_pool := v_vehicle_type.capacity_pool;

  PERFORM pg_advisory_xact_lock(
    hashtextextended(v_location_id::text || ':pool:' || v_pool, 0)
  );

  SELECT pl.car_capacity, pl.motorcycle_capacity
  INTO v_car_capacity, v_motorcycle_capacity
  FROM public.parking_locations pl
  WHERE pl.id = v_location_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'location not found' USING ERRCODE = '42501';
  END IF;

  IF v_pool = 'CAR' THEN
    v_capacity := v_car_capacity;
  ELSE
    v_capacity := v_motorcycle_capacity;
  END IF;

  SELECT count(*)::integer
  INTO v_occupied_count
  FROM public.parking_sessions s
  JOIN public.vehicles v ON v.id = s.vehicle_id
  JOIN public.vehicle_types vt ON vt.id = v.vehicle_type_id
  WHERE s.parking_location_id = v_location_id
    AND vt.capacity_pool = v_pool
    AND s.status IN (
      'ACTIVE', 'EXIT_PENDING', 'PAYMENT_PENDING',
      'PAID_AWAITING_EXIT', 'LOST_TICKET', 'MANUAL_REVIEW'
    );

  IF v_occupied_count >= v_capacity THEN
    PERFORM private.raise_domain_error('CAPACITY_FULL');
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.parking_sessions ps
    JOIN public.vehicles v ON v.id = ps.vehicle_id
    WHERE ps.parking_location_id = v_location_id
      AND v.normalized_plate_number = v_normalized_plate
      AND ps.status IN (
        'ACTIVE', 'EXIT_PENDING', 'PAYMENT_PENDING',
        'PAID_AWAITING_EXIT', 'LOST_TICKET', 'MANUAL_REVIEW'
      )
  ) THEN
    PERFORM private.raise_domain_error('ACTIVE_SESSION_EXISTS');
  END IF;

  v_entry_time := clock_timestamp();
  v_rate := private.find_effective_parking_rate(v_location_id, p_vehicle_type_id, v_entry_time);
  v_snapshot_json := private.build_rate_snapshot_payload(v_rate);
  v_snapshot_hash := extensions.digest(convert_to(v_snapshot_json::text, 'UTF8'), 'sha256');

  SELECT v.id
  INTO v_vehicle_id
  FROM public.vehicles v
  WHERE v.parking_location_id = v_location_id
    AND v.normalized_plate_number = v_normalized_plate;

  IF NOT FOUND THEN
    INSERT INTO public.vehicles (
      parking_location_id,
      display_plate_number,
      normalized_plate_number,
      vehicle_type_id,
      color
    )
    VALUES (
      v_location_id,
      v_display_plate,
      v_normalized_plate,
      p_vehicle_type_id,
      v_color
    )
    RETURNING id INTO v_vehicle_id;
  ELSE
    UPDATE public.vehicles v
    SET
      vehicle_type_id = p_vehicle_type_id,
      color = coalesce(v_color, v.color),
      display_plate_number = v_display_plate,
      updated_at = now()
    WHERE v.id = v_vehicle_id;
  END IF;

  INSERT INTO public.parking_sessions (
    parking_location_id,
    vehicle_id,
    parking_space_id,
    status,
    entry_processed_by,
    entry_time
  )
  VALUES (
    v_location_id,
    v_vehicle_id,
    NULL,
    'ACTIVE',
    v_actor_id,
    v_entry_time
  )
  RETURNING id INTO v_session_id;

  INSERT INTO public.parking_rate_snapshots (
    parking_location_id,
    parking_session_id,
    parking_rate_id,
    rate_version,
    mode,
    grace_minutes,
    initial_minutes,
    initial_fee_centavos,
    succeeding_interval_minutes,
    succeeding_fee_centavos,
    flat_fee_centavos,
    daily_max_centavos,
    overnight_fee_centavos,
    lost_ticket_penalty_centavos,
    snapshot_json,
    snapshot_hash
  )
  VALUES (
    v_location_id,
    v_session_id,
    v_rate.id,
    v_rate.version,
    v_rate.mode,
    v_rate.grace_minutes,
    v_rate.initial_minutes,
    v_rate.initial_fee_centavos,
    v_rate.succeeding_interval_minutes,
    v_rate.succeeding_fee_centavos,
    v_rate.flat_fee_centavos,
    v_rate.daily_max_centavos,
    v_rate.overnight_fee_centavos,
    v_rate.lost_ticket_penalty_centavos,
    v_snapshot_json,
    v_snapshot_hash
  );

  v_qr_token := private.generate_qr_token();
  v_qr_hash := private.hash_qr_token(v_qr_token);
  v_ticket_number := private.generate_ticket_number(v_location_id);

  INSERT INTO public.parking_tickets (
    parking_session_id,
    parking_location_id,
    ticket_number,
    qr_token_hash,
    status,
    issued_at
  )
  VALUES (
    v_session_id,
    v_location_id,
    v_ticket_number,
    v_qr_hash,
    'ACTIVE',
    v_entry_time
  )
  RETURNING id INTO v_ticket_id;

  v_response := jsonb_build_object(
    'session_id', v_session_id,
    'ticket_id', v_ticket_id,
    'ticket_number', v_ticket_number,
    'qr_payload', 'https://app.local/verify#v1.' || v_qr_token,
    'entry_time', v_entry_time,
    'status', 'ACTIVE'
  );

  v_sanitized := private.sanitize_entry_response(v_response);

  IF v_has_idempotency THEN
    UPDATE public.idempotency_keys ik
    SET
      request_hash = v_request_hash,
      resource_id = v_session_id,
      response_json = v_sanitized,
      status = 'COMPLETED',
      locked_until = NULL,
      expires_at = clock_timestamp() + interval '24 hours',
      updated_at = now()
    WHERE ik.id = v_existing.id;
  ELSE
    INSERT INTO public.idempotency_keys (
      actor_id,
      parking_location_id,
      operation,
      key,
      request_hash,
      resource_id,
      response_json,
      status,
      expires_at
    )
    VALUES (
      v_actor_id,
      v_location_id,
      'create_parking_entry',
      p_idempotency_key,
      v_request_hash,
      v_session_id,
      v_sanitized,
      'COMPLETED',
      clock_timestamp() + interval '24 hours'
    );
  END IF;

  PERFORM private.write_operational_audit(
    v_location_id,
    v_actor_id,
    'PARKING_ENTRY_CREATED',
    'parking_session',
    v_session_id,
    'SUCCESS',
    NULL,
    p_correlation_id,
    NULL,
    jsonb_build_object(
      'session_id', v_session_id,
      'ticket_id', v_ticket_id,
      'ticket_number', v_ticket_number,
      'capacity_pool', v_pool,
      'vehicle_id', v_vehicle_id
    )
  );

  RETURN v_response;
END;
$$;

REVOKE ALL ON FUNCTION public.create_parking_entry(text, uuid, text, uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_parking_entry(text, uuid, text, uuid, uuid) TO authenticated, service_role;

-- Pool sessions have no parking_space_id; validation response must tolerate NULL space FK.
CREATE OR REPLACE FUNCTION private.build_ticket_validation_response(
  p_session public.parking_sessions,
  p_ticket public.parking_tickets
)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT jsonb_build_object(
    'session_id', p_session.id,
    'ticket_number', p_ticket.ticket_number,
    'display_plate_number', v.display_plate_number,
    'vehicle_type', vt.code,
    'space_code', coalesce(sp.code, 'POOL'),
    'entry_time', p_session.entry_time,
    'status', p_session.status
  )
  FROM public.vehicles v
  JOIN public.vehicle_types vt
    ON vt.id = v.vehicle_type_id
   AND vt.parking_location_id = v.parking_location_id
  LEFT JOIN public.parking_spaces sp
    ON sp.id = p_session.parking_space_id
   AND sp.parking_location_id = p_session.parking_location_id
  WHERE v.id = p_session.vehicle_id
    AND v.parking_location_id = p_session.parking_location_id;
$$;

-- ---------------------------------------------------------------------------
-- Admin RPC: update location pool capacities
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_update_location_capacities(
  p_car_capacity integer,
  p_motorcycle_capacity integer
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_location_id uuid;
  v_actor_id uuid;
  v_before jsonb;
  v_correlation_id uuid := extensions.gen_random_uuid();
BEGIN
  v_location_id := private.require_active_admin();
  v_actor_id := auth.uid();

  IF p_car_capacity IS NULL OR p_motorcycle_capacity IS NULL THEN
    RAISE EXCEPTION 'car and motorcycle capacities are required' USING ERRCODE = '22023';
  END IF;

  IF p_car_capacity < 0 OR p_motorcycle_capacity < 0 THEN
    RAISE EXCEPTION 'capacities must be non-negative' USING ERRCODE = '22023';
  END IF;

  SELECT jsonb_build_object(
    'car_capacity', pl.car_capacity,
    'motorcycle_capacity', pl.motorcycle_capacity
  )
  INTO v_before
  FROM public.parking_locations pl
  WHERE pl.id = v_location_id;

  UPDATE public.parking_locations pl
  SET
    car_capacity = p_car_capacity,
    motorcycle_capacity = p_motorcycle_capacity,
    updated_at = clock_timestamp()
  WHERE pl.id = v_location_id;

  PERFORM private.write_configuration_audit(
    v_location_id,
    v_actor_id,
    'facility.capacities.update',
    'parking_location',
    v_location_id,
    'success',
    NULL,
    v_correlation_id,
    v_before,
    jsonb_build_object(
      'car_capacity', p_car_capacity,
      'motorcycle_capacity', p_motorcycle_capacity
    )
  );

  RETURN v_location_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_location_capacities(integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_update_location_capacities(integer, integer) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Dashboard snapshot: pool-based occupancy metrics
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_dashboard_snapshot(p_business_date date DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_location_id uuid;
  v_timezone text;
  v_business_date date;
  v_snapshot_at timestamptz := clock_timestamp();
  v_aggregate_version bigint;
  v_car_capacity integer;
  v_motorcycle_capacity integer;
  v_car_occupied integer;
  v_motorcycle_occupied integer;
  v_car_available integer;
  v_motorcycle_available integer;
  v_total_capacity integer;
  v_available integer;
  v_occupied integer;
  v_out_of_service integer;
  v_operational_capacity integer;
  v_occupancy_bps integer;
  v_active_sessions integer;
  v_payment_pending integer;
  v_paid_awaiting_exit integer;
  v_lost_ticket integer;
  v_manual_review integer;
  v_entries_today integer;
  v_exits_today integer;
  v_revenue bigint;
  v_zones jsonb;
  v_movements jsonb;
BEGIN
  IF NOT private.is_active_user() THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE = '42501';
  END IF;

  v_location_id := private.current_location_id();
  IF v_location_id IS NULL THEN
    RAISE EXCEPTION 'active profile required' USING ERRCODE = '42501';
  END IF;

  SELECT pl.timezone, pl.car_capacity, pl.motorcycle_capacity
  INTO v_timezone, v_car_capacity, v_motorcycle_capacity
  FROM public.parking_locations pl
  WHERE pl.id = v_location_id;

  IF v_timezone IS NULL THEN
    RAISE EXCEPTION 'location not found' USING ERRCODE = 'P0002';
  END IF;

  v_business_date := COALESCE(
    p_business_date,
    (v_snapshot_at AT TIME ZONE v_timezone)::date
  );

  SELECT COALESCE(dav.version, 0)
  INTO v_aggregate_version
  FROM private.dashboard_aggregate_versions dav
  WHERE dav.parking_location_id = v_location_id;

  v_aggregate_version := COALESCE(v_aggregate_version, 0);

  SELECT
    count(*) FILTER (
      WHERE vt.capacity_pool = 'CAR'
        AND s.status IN (
          'ACTIVE'::public.session_status,
          'EXIT_PENDING'::public.session_status,
          'PAYMENT_PENDING'::public.session_status,
          'PAID_AWAITING_EXIT'::public.session_status,
          'LOST_TICKET'::public.session_status,
          'MANUAL_REVIEW'::public.session_status
        )
    )::integer,
    count(*) FILTER (
      WHERE vt.capacity_pool = 'MOTORCYCLE'
        AND s.status IN (
          'ACTIVE'::public.session_status,
          'EXIT_PENDING'::public.session_status,
          'PAYMENT_PENDING'::public.session_status,
          'PAID_AWAITING_EXIT'::public.session_status,
          'LOST_TICKET'::public.session_status,
          'MANUAL_REVIEW'::public.session_status
        )
    )::integer
  INTO v_car_occupied, v_motorcycle_occupied
  FROM public.parking_sessions s
  JOIN public.vehicles v ON v.id = s.vehicle_id AND v.parking_location_id = s.parking_location_id
  JOIN public.vehicle_types vt ON vt.id = v.vehicle_type_id AND vt.parking_location_id = s.parking_location_id
  WHERE s.parking_location_id = v_location_id;

  v_car_available := GREATEST(v_car_capacity - v_car_occupied, 0);
  v_motorcycle_available := GREATEST(v_motorcycle_capacity - v_motorcycle_occupied, 0);
  v_total_capacity := v_car_capacity + v_motorcycle_capacity;
  v_occupied := v_car_occupied + v_motorcycle_occupied;
  v_available := v_car_available + v_motorcycle_available;
  v_operational_capacity := v_total_capacity;

  SELECT count(*) FILTER (WHERE ps.status = 'OUT_OF_SERVICE'::public.space_status)::integer
  INTO v_out_of_service
  FROM public.parking_spaces ps
  WHERE ps.parking_location_id = v_location_id
    AND ps.is_active = true;

  IF v_operational_capacity = 0 THEN
    v_occupancy_bps := 0;
  ELSE
    v_occupancy_bps := ((v_occupied * 10000) / v_operational_capacity);
  END IF;

  SELECT
    count(*) FILTER (
      WHERE s.status IN (
        'ACTIVE'::public.session_status,
        'EXIT_PENDING'::public.session_status,
        'PAYMENT_PENDING'::public.session_status,
        'PAID_AWAITING_EXIT'::public.session_status,
        'LOST_TICKET'::public.session_status,
        'MANUAL_REVIEW'::public.session_status
      )
    )::integer,
    count(*) FILTER (WHERE s.status = 'PAYMENT_PENDING'::public.session_status)::integer,
    count(*) FILTER (WHERE s.status = 'PAID_AWAITING_EXIT'::public.session_status)::integer,
    count(*) FILTER (WHERE s.status = 'LOST_TICKET'::public.session_status)::integer,
    count(*) FILTER (WHERE s.status = 'MANUAL_REVIEW'::public.session_status)::integer
  INTO
    v_active_sessions,
    v_payment_pending,
    v_paid_awaiting_exit,
    v_lost_ticket,
    v_manual_review
  FROM public.parking_sessions s
  WHERE s.parking_location_id = v_location_id;

  SELECT count(*)::integer
  INTO v_entries_today
  FROM public.parking_sessions s
  WHERE s.parking_location_id = v_location_id
    AND (s.entry_time AT TIME ZONE v_timezone)::date = v_business_date;

  SELECT count(*)::integer
  INTO v_exits_today
  FROM public.parking_sessions s
  WHERE s.parking_location_id = v_location_id
    AND s.exit_time IS NOT NULL
    AND (s.exit_time AT TIME ZONE v_timezone)::date = v_business_date;

  SELECT COALESCE(
    sum(
      CASE p.kind
        WHEN 'REVERSAL'::public.payment_kind THEN -p.amount_centavos
        ELSE p.amount_centavos
      END
    ),
    0
  )
  INTO v_revenue
  FROM public.payments p
  WHERE p.parking_location_id = v_location_id
    AND (p.processed_at AT TIME ZONE v_timezone)::date = v_business_date;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'zone_id', z.id,
        'zone_code', z.code,
        'zone_name', z.name,
        'total_spaces', stats.total_spaces,
        'available_spaces', stats.available_spaces,
        'occupied_spaces', stats.occupied_spaces,
        'out_of_service_spaces', stats.out_of_service_spaces
      )
      ORDER BY z.sort_order, z.code
    ),
    '[]'::jsonb
  )
  INTO v_zones
  FROM public.parking_zones z
  JOIN LATERAL (
    SELECT
      count(*)::integer AS total_spaces,
      count(*) FILTER (WHERE ps.status = 'AVAILABLE'::public.space_status)::integer AS available_spaces,
      count(*) FILTER (WHERE ps.status = 'OCCUPIED'::public.space_status)::integer AS occupied_spaces,
      count(*) FILTER (WHERE ps.status = 'OUT_OF_SERVICE'::public.space_status)::integer AS out_of_service_spaces
    FROM public.parking_spaces ps
    WHERE ps.zone_id = z.id
      AND ps.parking_location_id = v_location_id
      AND ps.is_active = true
  ) stats ON true
  WHERE z.parking_location_id = v_location_id
    AND z.is_active = true;

  SELECT COALESCE(jsonb_agg(row_payload), '[]'::jsonb)
  INTO v_movements
  FROM (
    SELECT jsonb_build_object(
      'kind', m.kind,
      'occurred_at', m.occurred_at,
      'session_id', m.session_id,
      'plate_display', m.plate_display,
      'space_code', m.space_code,
      'zone_code', m.zone_code,
      'session_status', m.session_status
    ) AS row_payload
    FROM (
      SELECT
        'entry'::text AS kind,
        s.entry_time AS occurred_at,
        s.id AS session_id,
        v.display_plate_number AS plate_display,
        coalesce(ps.code, 'POOL') AS space_code,
        coalesce(z.code, vt.capacity_pool, 'GEN') AS zone_code,
        s.status::text AS session_status
      FROM public.parking_sessions s
      JOIN public.vehicles v
        ON v.id = s.vehicle_id AND v.parking_location_id = s.parking_location_id
      JOIN public.vehicle_types vt
        ON vt.id = v.vehicle_type_id AND vt.parking_location_id = s.parking_location_id
      LEFT JOIN public.parking_spaces ps
        ON ps.id = s.parking_space_id AND ps.parking_location_id = s.parking_location_id
      LEFT JOIN public.parking_zones z
        ON z.id = ps.zone_id AND z.parking_location_id = s.parking_location_id
      WHERE s.parking_location_id = v_location_id
        AND (s.entry_time AT TIME ZONE v_timezone)::date = v_business_date
      UNION ALL
      SELECT
        'exit'::text,
        s.exit_time,
        s.id,
        v.display_plate_number,
        coalesce(ps.code, 'POOL'),
        coalesce(z.code, vt.capacity_pool, 'GEN'),
        s.status::text
      FROM public.parking_sessions s
      JOIN public.vehicles v
        ON v.id = s.vehicle_id AND v.parking_location_id = s.parking_location_id
      JOIN public.vehicle_types vt
        ON vt.id = v.vehicle_type_id AND vt.parking_location_id = s.parking_location_id
      LEFT JOIN public.parking_spaces ps
        ON ps.id = s.parking_space_id AND ps.parking_location_id = s.parking_location_id
      LEFT JOIN public.parking_zones z
        ON z.id = ps.zone_id AND z.parking_location_id = s.parking_location_id
      WHERE s.parking_location_id = v_location_id
        AND s.exit_time IS NOT NULL
        AND (s.exit_time AT TIME ZONE v_timezone)::date = v_business_date
    ) m
    ORDER BY m.occurred_at DESC
    LIMIT 20
  ) bounded;

  RETURN jsonb_build_object(
    'snapshot_at', v_snapshot_at,
    'business_date', v_business_date,
    'aggregate_version', v_aggregate_version,
    'location_id', v_location_id,
    'timezone', v_timezone,
    'metrics', jsonb_build_object(
      'total_capacity', v_total_capacity,
      'available_spaces', v_available,
      'occupied_spaces', v_occupied,
      'out_of_service_spaces', v_out_of_service,
      'operational_capacity', v_operational_capacity,
      'occupancy_basis_points', v_occupancy_bps,
      'car_capacity', v_car_capacity,
      'car_occupied', v_car_occupied,
      'motorcycle_capacity', v_motorcycle_capacity,
      'motorcycle_occupied', v_motorcycle_occupied,
      'active_sessions', v_active_sessions,
      'payment_pending_sessions', v_payment_pending,
      'paid_awaiting_exit_sessions', v_paid_awaiting_exit,
      'lost_ticket_sessions', v_lost_ticket,
      'manual_review_sessions', v_manual_review,
      'entries_today', v_entries_today,
      'exits_today', v_exits_today,
      'revenue_today_centavos', v_revenue
    ),
    'zones', v_zones,
    'recent_movements', v_movements
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_dashboard_snapshot(date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_dashboard_snapshot(date) TO authenticated;
