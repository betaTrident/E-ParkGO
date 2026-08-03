-- Phase 7: ticket validation, deterministic fee engine, and exit preview RPCs.

CREATE OR REPLACE FUNCTION private.is_valid_qr_token_shape(p_token text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT p_token IS NOT NULL
    AND length(p_token) = 43
    AND p_token ~ '^[A-Za-z0-9_-]{43}$'
    AND octet_length(
      decode(
        rpad(
          replace(replace(p_token, '-', '+'), '_', '/'),
          (4 - (length(p_token) % 4)) % 4 + length(p_token),
          '='
        ),
        'base64'
      )
    ) = 32;
$$;

CREATE OR REPLACE FUNCTION private.normalize_ticket_number_lookup(p_ticket text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = ''
AS $$
DECLARE
  v_normalized text;
BEGIN
  v_normalized := upper(btrim(coalesce(p_ticket, '')));

  IF char_length(v_normalized) < 12 OR char_length(v_normalized) > 32 THEN
    RAISE EXCEPTION 'invalid ticket number' USING ERRCODE = '22023';
  END IF;

  IF v_normalized !~ '^[A-Z0-9][A-Z0-9-]{10,30}[A-Z0-9]$' THEN
    RAISE EXCEPTION 'invalid ticket number' USING ERRCODE = '22023';
  END IF;

  RETURN v_normalized;
END;
$$;

CREATE OR REPLACE FUNCTION private.consume_operation_rate_limit(
  p_actor_id uuid,
  p_location_id uuid,
  p_operation text,
  p_max_requests integer,
  p_window_seconds integer
)
RETURNS void
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_now timestamptz := clock_timestamp();
  v_bucket_start timestamptz;
  v_count integer;
BEGIN
  v_bucket_start := to_timestamp(
    floor(extract(epoch FROM v_now) / p_window_seconds) * p_window_seconds
  );

  INSERT INTO public.rate_limit_buckets (
    actor_id,
    parking_location_id,
    operation,
    bucket_start,
    request_count
  )
  VALUES (
    p_actor_id,
    p_location_id,
    p_operation,
    v_bucket_start,
    1
  )
  ON CONFLICT (actor_id, operation, bucket_start)
  DO UPDATE
  SET
    request_count = public.rate_limit_buckets.request_count + 1,
    updated_at = now()
  RETURNING request_count INTO v_count;

  IF v_count > p_max_requests THEN
    PERFORM private.raise_domain_error('RATE_LIMITED');
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION private.count_local_overnight_boundaries(
  p_entry_time timestamptz,
  p_quote_time timestamptz,
  p_timezone text
)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
SET search_path = ''
AS $$
DECLARE
  v_start_date date;
  v_end_date date;
BEGIN
  IF p_quote_time <= p_entry_time THEN
    RETURN 0;
  END IF;

  v_start_date := (p_entry_time AT TIME ZONE p_timezone)::date;
  v_end_date := (p_quote_time AT TIME ZONE p_timezone)::date;

  IF v_end_date <= v_start_date THEN
    RETURN 0;
  END IF;

  RETURN (v_end_date - v_start_date);
END;
$$;

CREATE OR REPLACE FUNCTION private.calculate_tiered_block_fee(
  p_block_minutes integer,
  p_grace_minutes integer,
  p_initial_minutes integer,
  p_initial_fee_centavos bigint,
  p_interval_minutes integer,
  p_interval_fee_centavos bigint
)
RETURNS bigint
LANGUAGE plpgsql
IMMUTABLE
SET search_path = ''
AS $$
DECLARE
  v_remaining integer;
BEGIN
  IF p_block_minutes <= 0 THEN
    RETURN 0;
  END IF;

  IF p_block_minutes <= p_grace_minutes THEN
    RETURN 0;
  END IF;

  IF p_block_minutes <= p_initial_minutes THEN
    RETURN p_initial_fee_centavos;
  END IF;

  v_remaining := p_block_minutes - p_initial_minutes;
  RETURN p_initial_fee_centavos
    + (ceil(v_remaining::numeric / p_interval_minutes::numeric)::integer * p_interval_fee_centavos);
END;
$$;

CREATE OR REPLACE FUNCTION private.calculate_flat_block_fee(
  p_block_minutes integer,
  p_grace_minutes integer,
  p_flat_fee_centavos bigint
)
RETURNS bigint
LANGUAGE plpgsql
IMMUTABLE
SET search_path = ''
AS $$
BEGIN
  IF p_block_minutes <= 0 OR p_block_minutes <= p_grace_minutes THEN
    RETURN 0;
  END IF;

  RETURN p_flat_fee_centavos;
END;
$$;

CREATE OR REPLACE FUNCTION private.apply_percent_discount_half_up(
  p_amount bigint,
  p_discount_percent integer
)
RETURNS bigint
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT CASE
    WHEN p_amount <= 0 OR p_discount_percent <= 0 THEN 0::bigint
    ELSE ((p_amount * p_discount_percent::bigint) + 50) / 100
  END;
$$;

CREATE OR REPLACE FUNCTION private.calculate_parking_fee(
  p_snapshot public.parking_rate_snapshots,
  p_entry_time timestamptz,
  p_quote_time timestamptz,
  p_timezone text DEFAULT 'Asia/Manila',
  p_extra_penalty_centavos bigint DEFAULT 0,
  p_discount_percent integer DEFAULT 0,
  p_complimentary boolean DEFAULT false,
  p_adjustment_centavos bigint DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SET search_path = ''
AS $$
DECLARE
  v_elapsed_seconds bigint;
  v_billable_minutes integer;
  v_remaining_minutes integer;
  v_block_minutes integer;
  v_block_fee bigint;
  v_subtotal bigint := 0;
  v_overnight_count integer;
  v_overnight_total bigint := 0;
  v_eligible bigint;
  v_discount bigint := 0;
  v_penalty bigint := 0;
  v_total bigint;
BEGIN
  IF p_quote_time < p_entry_time THEN
    RAISE EXCEPTION 'quote before entry' USING ERRCODE = '22023';
  END IF;

  v_elapsed_seconds := GREATEST(
    0,
    floor(extract(epoch FROM (p_quote_time - p_entry_time)))::bigint
  );
  v_billable_minutes := ceil(v_elapsed_seconds::numeric / 60.0)::integer;
  v_remaining_minutes := v_billable_minutes;

  WHILE v_remaining_minutes > 0 LOOP
    v_block_minutes := LEAST(v_remaining_minutes, 1440);

    IF p_snapshot.mode = 'FLAT' THEN
      v_block_fee := private.calculate_flat_block_fee(
        v_block_minutes,
        p_snapshot.grace_minutes,
        coalesce(p_snapshot.flat_fee_centavos, 0)
      );
    ELSE
      v_block_fee := private.calculate_tiered_block_fee(
        v_block_minutes,
        p_snapshot.grace_minutes,
        coalesce(p_snapshot.initial_minutes, 0),
        coalesce(p_snapshot.initial_fee_centavos, 0),
        coalesce(p_snapshot.succeeding_interval_minutes, 60),
        coalesce(p_snapshot.succeeding_fee_centavos, 0)
      );
    END IF;

    IF p_snapshot.daily_max_centavos IS NOT NULL THEN
      v_block_fee := LEAST(v_block_fee, p_snapshot.daily_max_centavos);
    END IF;

    v_subtotal := v_subtotal + v_block_fee;
    v_remaining_minutes := v_remaining_minutes - v_block_minutes;
  END LOOP;

  v_overnight_count := private.count_local_overnight_boundaries(
    p_entry_time,
    p_quote_time,
    p_timezone
  );
  v_overnight_total := v_overnight_count * p_snapshot.overnight_fee_centavos;

  v_eligible := v_subtotal + v_overnight_total;

  IF p_complimentary THEN
    v_eligible := 0;
    v_discount := 0;
  ELSE
    v_discount := private.apply_percent_discount_half_up(v_eligible, p_discount_percent);
    v_eligible := GREATEST(v_eligible - v_discount, 0);
  END IF;

  v_penalty := GREATEST(p_extra_penalty_centavos, 0);
  v_total := v_eligible + v_penalty + p_adjustment_centavos;

  IF v_total < 0 THEN
    v_total := 0;
  END IF;

  RETURN jsonb_build_object(
    'billed_minutes', v_billable_minutes,
    'subtotal_centavos', v_subtotal + v_overnight_total,
    'discount_centavos', v_discount,
    'penalty_centavos', v_penalty,
    'adjustment_centavos', p_adjustment_centavos,
    'total_centavos', v_total,
    'fee_version', p_snapshot.rate_version,
    'overnight_count', v_overnight_count,
    'breakdown', jsonb_build_object(
      'base_centavos', v_subtotal,
      'overnight_centavos', v_overnight_total,
      'eligible_centavos', v_subtotal + v_overnight_total
    )
  );
END;
$$;

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
    'space_code', sp.code,
    'entry_time', p_session.entry_time,
    'status', p_session.status
  )
  FROM public.vehicles v
  JOIN public.vehicle_types vt
    ON vt.id = v.vehicle_type_id
   AND vt.parking_location_id = v.parking_location_id
  JOIN public.parking_spaces sp
    ON sp.id = p_session.parking_space_id
   AND sp.parking_location_id = p_session.parking_location_id
  WHERE v.id = p_session.vehicle_id
    AND v.parking_location_id = p_session.parking_location_id;
$$;

CREATE OR REPLACE FUNCTION public.validate_parking_ticket(
  p_token text,
  p_ticket_number text,
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
  v_has_token boolean := p_token IS NOT NULL AND btrim(p_token) <> '';
  v_has_ticket boolean := p_ticket_number IS NOT NULL AND btrim(p_ticket_number) <> '';
  v_normalized_ticket text;
  v_token_hash bytea;
  v_request jsonb;
  v_request_hash bytea;
  v_existing public.idempotency_keys%ROWTYPE;
  v_ticket public.parking_tickets%ROWTYPE;
  v_session public.parking_sessions%ROWTYPE;
  v_response jsonb;
  v_scan_count integer := 0;
  v_has_idempotency boolean := false;
BEGIN
  v_location_id := private.require_active_staff();
  v_actor_id := auth.uid();

  IF p_idempotency_key IS NULL OR p_correlation_id IS NULL THEN
    RAISE EXCEPTION 'idempotency and correlation ids are required' USING ERRCODE = '22023';
  END IF;

  IF v_has_token = v_has_ticket THEN
    RAISE EXCEPTION 'exactly one lookup input is required' USING ERRCODE = '22023';
  END IF;

  IF v_has_token THEN
    IF NOT private.is_valid_qr_token_shape(p_token) THEN
      PERFORM private.raise_domain_error('TICKET_INVALID');
    END IF;
    v_token_hash := private.hash_qr_token(p_token);
    v_request := jsonb_build_object('lookup', 'token', 'token_hash', encode(v_token_hash, 'hex'));
  ELSE
    v_normalized_ticket := private.normalize_ticket_number_lookup(p_ticket_number);
    v_request := jsonb_build_object('lookup', 'ticket_number', 'ticket_number', v_normalized_ticket);
  END IF;

  v_request_hash := private.hash_idempotency_request(v_request);

  PERFORM private.consume_operation_rate_limit(
    v_actor_id,
    v_location_id,
    'validate_parking_ticket',
    120,
    300
  );

  SELECT ik.*
  INTO v_existing
  FROM public.idempotency_keys ik
  WHERE ik.actor_id = v_actor_id
    AND ik.operation = 'validate_parking_ticket'
    AND ik.key = p_idempotency_key
  FOR UPDATE;

  IF FOUND THEN
    IF v_existing.request_hash <> v_request_hash THEN
      PERFORM private.raise_domain_error('IDEMPOTENCY_CONFLICT');
    END IF;
    RETURN v_existing.response_json;
  END IF;

  IF v_has_token THEN
    SELECT pt.*
    INTO v_ticket
    FROM public.parking_tickets pt
    WHERE pt.qr_token_hash = v_token_hash
      AND pt.parking_location_id = v_location_id
    FOR UPDATE;
  ELSE
    SELECT pt.*
    INTO v_ticket
    FROM public.parking_tickets pt
    WHERE pt.ticket_number = v_normalized_ticket
      AND pt.parking_location_id = v_location_id
    FOR UPDATE;
  END IF;

  IF NOT FOUND THEN
    PERFORM private.raise_domain_error('TICKET_INVALID');
  END IF;

  IF v_ticket.status = 'REVOKED' THEN
    PERFORM private.raise_domain_error('TICKET_REVOKED');
  END IF;

  IF v_ticket.status = 'COMPLETED' THEN
    PERFORM private.raise_domain_error('TICKET_ALREADY_COMPLETED');
  END IF;

  SELECT ps.*
  INTO v_session
  FROM public.parking_sessions ps
  WHERE ps.id = v_ticket.parking_session_id
    AND ps.parking_location_id = v_location_id
  FOR UPDATE;

  IF NOT FOUND OR v_session.parking_location_id <> v_location_id THEN
    PERFORM private.raise_domain_error('TICKET_INVALID');
  END IF;

  IF v_session.status IN ('COMPLETED', 'CANCELLED') THEN
    PERFORM private.raise_domain_error('TICKET_ALREADY_COMPLETED');
  END IF;

  IF v_session.status = 'ACTIVE' THEN
    UPDATE public.parking_sessions ps
    SET
      status = 'EXIT_PENDING',
      version = ps.version + 1,
      updated_at = now()
    WHERE ps.id = v_session.id
    RETURNING * INTO v_session;
  ELSIF v_session.status <> 'EXIT_PENDING' THEN
    PERFORM private.raise_domain_error('INVALID_STATUS_TRANSITION');
  END IF;

  v_response := private.build_ticket_validation_response(v_session, v_ticket);

  SELECT count(*)::integer
  INTO v_scan_count
  FROM public.audit_logs al
  WHERE al.target_type = 'parking_session'
    AND al.target_id = v_session.id
    AND al.action = 'TICKET_VALIDATED';

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
    'validate_parking_ticket',
    p_idempotency_key,
    v_request_hash,
    v_session.id,
    v_response,
    'COMPLETED',
    clock_timestamp() + interval '24 hours'
  );

  PERFORM private.write_operational_audit(
    v_location_id,
    v_actor_id,
    'TICKET_VALIDATED',
    'parking_session',
    v_session.id,
    'SUCCESS',
    NULL,
    p_correlation_id,
    NULL,
    jsonb_build_object(
      'ticket_id', v_ticket.id,
      'ticket_number', v_ticket.ticket_number,
      'session_status', v_session.status,
      'scan_count', v_scan_count + 1
    )
  );

  RETURN v_response;
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_parking_exit(
  p_session_id uuid,
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
  v_request jsonb;
  v_request_hash bytea;
  v_existing public.idempotency_keys%ROWTYPE;
  v_session public.parking_sessions%ROWTYPE;
  v_snapshot public.parking_rate_snapshots%ROWTYPE;
  v_timezone text;
  v_quote_time timestamptz;
  v_fee jsonb;
  v_total bigint;
  v_response jsonb;
  v_extra_penalty bigint := 0;
BEGIN
  v_location_id := private.require_active_staff();
  v_actor_id := auth.uid();

  IF p_idempotency_key IS NULL OR p_correlation_id IS NULL THEN
    RAISE EXCEPTION 'idempotency and correlation ids are required' USING ERRCODE = '22023';
  END IF;

  v_request := jsonb_build_object('session_id', p_session_id);
  v_request_hash := private.hash_idempotency_request(v_request);

  SELECT ik.*
  INTO v_existing
  FROM public.idempotency_keys ik
  WHERE ik.actor_id = v_actor_id
    AND ik.operation = 'calculate_parking_exit'
    AND ik.key = p_idempotency_key
  FOR UPDATE;

  IF FOUND THEN
    IF v_existing.request_hash <> v_request_hash THEN
      PERFORM private.raise_domain_error('IDEMPOTENCY_CONFLICT');
    END IF;
    RETURN v_existing.response_json;
  END IF;

  SELECT ps.*
  INTO v_session
  FROM public.parking_sessions ps
  WHERE ps.id = p_session_id
    AND ps.parking_location_id = v_location_id
  FOR UPDATE;

  IF NOT FOUND THEN
    PERFORM private.raise_domain_error('INVALID_STATUS_TRANSITION');
  END IF;

  IF v_session.status NOT IN ('EXIT_PENDING', 'PAYMENT_PENDING', 'LOST_TICKET') THEN
    PERFORM private.raise_domain_error('INVALID_STATUS_TRANSITION');
  END IF;

  SELECT prs.*
  INTO v_snapshot
  FROM public.parking_rate_snapshots prs
  WHERE prs.parking_session_id = v_session.id
    AND prs.parking_location_id = v_location_id;

  IF NOT FOUND THEN
    PERFORM private.raise_domain_error('RATE_NOT_CONFIGURED');
  END IF;

  SELECT pl.timezone
  INTO v_timezone
  FROM public.parking_locations pl
  WHERE pl.id = v_location_id;

  v_quote_time := clock_timestamp();

  IF v_session.status = 'LOST_TICKET' THEN
    v_extra_penalty := v_snapshot.lost_ticket_penalty_centavos;
  END IF;

  v_fee := private.calculate_parking_fee(
    v_snapshot,
    v_session.entry_time,
    v_quote_time,
    coalesce(v_timezone, 'Asia/Manila'),
    v_extra_penalty,
    0,
    false,
    0
  );

  v_total := (v_fee->>'total_centavos')::bigint;

  IF v_total > 0 THEN
    UPDATE public.parking_sessions ps
    SET
      status = 'PAYMENT_PENDING',
      payment_status = 'UNPAID',
      fee_calculated_at = v_quote_time,
      quote_expires_at = v_quote_time + interval '15 minutes',
      total_minutes = (v_fee->>'billed_minutes')::integer,
      subtotal_centavos = (v_fee->>'subtotal_centavos')::bigint,
      discount_centavos = (v_fee->>'discount_centavos')::bigint,
      penalty_centavos = (v_fee->>'penalty_centavos')::bigint,
      adjustment_centavos = (v_fee->>'adjustment_centavos')::bigint,
      total_centavos = v_total,
      version = ps.version + 1,
      updated_at = now()
    WHERE ps.id = v_session.id
    RETURNING * INTO v_session;
  ELSE
    UPDATE public.parking_sessions ps
    SET
      status = 'PAID_AWAITING_EXIT',
      payment_status = 'NOT_REQUIRED',
      fee_calculated_at = v_quote_time,
      quote_expires_at = v_quote_time + interval '15 minutes',
      total_minutes = (v_fee->>'billed_minutes')::integer,
      subtotal_centavos = (v_fee->>'subtotal_centavos')::bigint,
      discount_centavos = (v_fee->>'discount_centavos')::bigint,
      penalty_centavos = (v_fee->>'penalty_centavos')::bigint,
      adjustment_centavos = (v_fee->>'adjustment_centavos')::bigint,
      total_centavos = 0,
      version = ps.version + 1,
      updated_at = now()
    WHERE ps.id = v_session.id
    RETURNING * INTO v_session;
  END IF;

  v_response := jsonb_build_object(
    'session_id', v_session.id,
    'status', v_session.status,
    'billed_minutes', (v_fee->>'billed_minutes')::integer,
    'subtotal_centavos', (v_fee->>'subtotal_centavos')::bigint,
    'discount_centavos', (v_fee->>'discount_centavos')::bigint,
    'penalty_centavos', (v_fee->>'penalty_centavos')::bigint,
    'adjustment_centavos', (v_fee->>'adjustment_centavos')::bigint,
    'total_centavos', v_total,
    'fee_version', (v_fee->>'fee_version')::integer,
    'quote_expires_at', v_session.quote_expires_at
  );

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
    'calculate_parking_exit',
    p_idempotency_key,
    v_request_hash,
    v_session.id,
    v_response,
    'COMPLETED',
    clock_timestamp() + interval '24 hours'
  );

  PERFORM private.write_operational_audit(
    v_location_id,
    v_actor_id,
    'EXIT_FEE_CALCULATED',
    'parking_session',
    v_session.id,
    'SUCCESS',
    NULL,
    p_correlation_id,
    NULL,
    v_fee
  );

  RETURN v_response;
END;
$$;

REVOKE ALL ON FUNCTION private.is_valid_qr_token_shape(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.normalize_ticket_number_lookup(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.consume_operation_rate_limit(uuid, uuid, text, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.count_local_overnight_boundaries(timestamptz, timestamptz, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.calculate_tiered_block_fee(integer, integer, integer, bigint, integer, bigint) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.calculate_flat_block_fee(integer, integer, bigint) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.apply_percent_discount_half_up(bigint, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.calculate_parking_fee(public.parking_rate_snapshots, timestamptz, timestamptz, text, bigint, integer, boolean, bigint) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.build_ticket_validation_response(public.parking_sessions, public.parking_tickets) FROM PUBLIC;

REVOKE ALL ON FUNCTION public.validate_parking_ticket(text, text, uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.calculate_parking_exit(uuid, uuid, uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.validate_parking_ticket(text, text, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_parking_exit(uuid, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.calculate_parking_fee(public.parking_rate_snapshots, timestamptz, timestamptz, text, bigint, integer, boolean, bigint) TO service_role;
