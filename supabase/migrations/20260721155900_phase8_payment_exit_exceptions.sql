-- Phase 8: cash shifts, payments, confirmed exit, and exception workflows.

CREATE OR REPLACE FUNCTION private.generate_receipt_number(p_location_id uuid)
RETURNS text
LANGUAGE plpgsql
VOLATILE
SET search_path = ''
AS $$
DECLARE
  v_prefix text;
  v_body text;
  v_receipt text;
  v_attempts integer := 0;
BEGIN
  SELECT pl.receipt_prefix
  INTO v_prefix
  FROM public.parking_locations pl
  WHERE pl.id = p_location_id;

  IF v_prefix IS NULL THEN
    RAISE EXCEPTION 'location not found' USING ERRCODE = '42501';
  END IF;

  LOOP
    v_attempts := v_attempts + 1;
    v_body := private.crockford_random(6);
    v_receipt := upper(
      v_prefix
      || '-RCP-'
      || to_char(clock_timestamp() AT TIME ZONE 'Asia/Manila', 'YYMMDD')
      || '-'
      || v_body
      || private.crockford_check_character(v_body)
    );

    EXIT WHEN NOT EXISTS (
      SELECT 1
      FROM public.payments p
      WHERE p.receipt_number = v_receipt
    );

    IF v_attempts > 25 THEN
      RAISE EXCEPTION 'unable to allocate receipt number' USING ERRCODE = 'P0001';
    END IF;
  END LOOP;

  RETURN v_receipt;
END;
$$;

CREATE OR REPLACE FUNCTION private.hash_json_digest(p_payload jsonb)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT encode(extensions.digest(convert_to(p_payload::text, 'UTF8'), 'sha256'), 'hex');
$$;

CREATE OR REPLACE FUNCTION private.session_correction_factors(p_session_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SET search_path = ''
AS $$
DECLARE
  v_discount integer := 0;
  v_complimentary boolean := false;
  v_adjustment bigint := 0;
  v_extra_penalty bigint := 0;
  v_row record;
BEGIN
  FOR v_row IN
    SELECT sc.correction_type, sc.after_data
    FROM public.session_corrections sc
    WHERE sc.parking_session_id = p_session_id
    ORDER BY sc.created_at ASC
  LOOP
    CASE v_row.correction_type
      WHEN 'DISCOUNT_PERCENT' THEN
        v_discount := GREATEST(v_discount, coalesce((v_row.after_data->>'discount_percent')::integer, 0));
      WHEN 'COMPLIMENTARY' THEN
        v_complimentary := coalesce((v_row.after_data->>'complimentary')::boolean, true);
      WHEN 'ADJUSTMENT_CENTAVOS' THEN
        v_adjustment := v_adjustment + coalesce((v_row.after_data->>'adjustment_centavos')::bigint, 0);
      ELSE
        NULL;
    END CASE;
  END LOOP;

  IF EXISTS (
    SELECT 1
    FROM public.parking_sessions ps
    WHERE ps.id = p_session_id
      AND ps.status = 'LOST_TICKET'
  ) THEN
    SELECT prs.lost_ticket_penalty_centavos
    INTO v_extra_penalty
    FROM public.parking_rate_snapshots prs
    WHERE prs.parking_session_id = p_session_id;
  END IF;

  RETURN jsonb_build_object(
    'discount_percent', v_discount,
    'complimentary', v_complimentary,
    'adjustment_centavos', v_adjustment,
    'extra_penalty_centavos', coalesce(v_extra_penalty, 0)
  );
END;
$$;

CREATE OR REPLACE FUNCTION private.session_net_collected_centavos(p_session_id uuid)
RETURNS bigint
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT coalesce(
    sum(
      CASE
        WHEN p.kind = 'REVERSAL' THEN -p.amount_centavos
        ELSE p.amount_centavos
      END
    ),
    0
  )
  FROM public.payments p
  WHERE p.parking_session_id = p_session_id
    AND p.kind IN ('COLLECTION', 'TOP_UP', 'REVERSAL');
$$;

CREATE OR REPLACE FUNCTION private.require_open_staff_shift(
  p_location_id uuid,
  p_actor_id uuid
)
RETURNS public.staff_shifts
LANGUAGE plpgsql
STABLE
SET search_path = ''
AS $$
DECLARE
  v_shift public.staff_shifts;
BEGIN
  SELECT ss.*
  INTO v_shift
  FROM public.staff_shifts ss
  WHERE ss.parking_location_id = p_location_id
    AND ss.profile_id = p_actor_id
    AND ss.status = 'OPEN'
  ORDER BY ss.opened_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    PERFORM private.raise_domain_error('SHIFT_REQUIRED');
  END IF;

  RETURN v_shift;
END;
$$;

CREATE OR REPLACE FUNCTION private.recalculate_session_quote_locked(
  p_session public.parking_sessions,
  p_location_id uuid,
  p_quote_time timestamptz
)
RETURNS public.parking_sessions
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_snapshot public.parking_rate_snapshots;
  v_timezone text;
  v_factors jsonb;
  v_fee jsonb;
  v_total bigint;
  v_session public.parking_sessions;
BEGIN
  SELECT prs.*
  INTO v_snapshot
  FROM public.parking_rate_snapshots prs
  WHERE prs.parking_session_id = p_session.id
    AND prs.parking_location_id = p_location_id;

  IF NOT FOUND THEN
    PERFORM private.raise_domain_error('RATE_NOT_CONFIGURED');
  END IF;

  SELECT pl.timezone
  INTO v_timezone
  FROM public.parking_locations pl
  WHERE pl.id = p_location_id;

  v_factors := private.session_correction_factors(p_session.id);

  v_fee := private.calculate_parking_fee(
    v_snapshot,
    p_session.entry_time,
    p_quote_time,
    coalesce(v_timezone, 'Asia/Manila'),
    coalesce((v_factors->>'extra_penalty_centavos')::bigint, 0),
    coalesce((v_factors->>'discount_percent')::integer, 0),
    coalesce((v_factors->>'complimentary')::boolean, false),
    coalesce((v_factors->>'adjustment_centavos')::bigint, 0)
  );

  v_total := (v_fee->>'total_centavos')::bigint;

  UPDATE public.parking_sessions ps
  SET
    fee_calculated_at = p_quote_time,
    quote_expires_at = p_quote_time + interval '15 minutes',
    total_minutes = (v_fee->>'billed_minutes')::integer,
    subtotal_centavos = (v_fee->>'subtotal_centavos')::bigint,
    discount_centavos = (v_fee->>'discount_centavos')::bigint,
    penalty_centavos = (v_fee->>'penalty_centavos')::bigint,
    adjustment_centavos = (v_fee->>'adjustment_centavos')::bigint,
    total_centavos = v_total,
    version = ps.version + 1,
    updated_at = now()
  WHERE ps.id = p_session.id
  RETURNING * INTO v_session;

  RETURN v_session;
END;
$$;

CREATE OR REPLACE FUNCTION private.release_occupied_space(
  p_space_id uuid,
  p_location_id uuid
)
RETURNS void
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  UPDATE public.parking_spaces ps
  SET
    status = 'AVAILABLE',
    version = ps.version + 1,
    updated_at = now()
  WHERE ps.id = p_space_id
    AND ps.parking_location_id = p_location_id
    AND ps.status = 'OCCUPIED';
END;
$$;

CREATE OR REPLACE FUNCTION public.start_staff_shift(
  p_device_id uuid,
  p_opening_float_centavos bigint,
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
  v_shift public.staff_shifts;
  v_response jsonb;
BEGIN
  v_location_id := private.require_active_staff();
  v_actor_id := auth.uid();

  IF p_idempotency_key IS NULL OR p_correlation_id IS NULL THEN
    RAISE EXCEPTION 'idempotency and correlation ids are required' USING ERRCODE = '22023';
  END IF;

  IF p_opening_float_centavos IS NULL OR p_opening_float_centavos < 0 THEN
    RAISE EXCEPTION 'opening float must be nonnegative' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(v_location_id::text || ':' || v_actor_id::text));

  v_request := jsonb_build_object(
    'device_id', p_device_id,
    'opening_float_centavos', p_opening_float_centavos
  );
  v_request_hash := private.hash_idempotency_request(v_request);

  SELECT ik.*
  INTO v_existing
  FROM public.idempotency_keys ik
  WHERE ik.actor_id = v_actor_id
    AND ik.operation = 'start_staff_shift'
    AND ik.key = p_idempotency_key
  FOR UPDATE;

  IF FOUND THEN
    IF v_existing.request_hash <> v_request_hash THEN
      PERFORM private.raise_domain_error('IDEMPOTENCY_CONFLICT');
    END IF;
    RETURN v_existing.response_json;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.staff_shifts ss
    WHERE ss.parking_location_id = v_location_id
      AND ss.profile_id = v_actor_id
      AND ss.status = 'OPEN'
  ) THEN
    PERFORM private.raise_domain_error('INVALID_STATUS_TRANSITION');
  END IF;

  IF p_device_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.devices d
    WHERE d.id = p_device_id
      AND d.parking_location_id = v_location_id
      AND d.is_active = true
  ) THEN
    RAISE EXCEPTION 'invalid device' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.staff_shifts (
    parking_location_id,
    profile_id,
    device_id,
    status,
    opening_float_centavos
  )
  VALUES (
    v_location_id,
    v_actor_id,
    p_device_id,
    'OPEN',
    p_opening_float_centavos
  )
  RETURNING * INTO v_shift;

  v_response := jsonb_build_object(
    'shift_id', v_shift.id,
    'status', v_shift.status,
    'opened_at', v_shift.opened_at,
    'opening_float_centavos', v_shift.opening_float_centavos
  );

  INSERT INTO public.idempotency_keys (
    actor_id, parking_location_id, operation, key, request_hash,
    resource_id, response_json, status, expires_at
  )
  VALUES (
    v_actor_id, v_location_id, 'start_staff_shift', p_idempotency_key,
    v_request_hash, v_shift.id, v_response, 'COMPLETED',
    clock_timestamp() + interval '24 hours'
  );

  PERFORM private.write_operational_audit(
    v_location_id, v_actor_id, 'SHIFT_STARTED', 'staff_shift', v_shift.id,
    'SUCCESS', NULL, p_correlation_id, NULL, v_response
  );

  RETURN v_response;
END;
$$;

CREATE OR REPLACE FUNCTION public.close_staff_shift(
  p_shift_id uuid,
  p_declared_cash_centavos bigint,
  p_notes text,
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
  v_shift public.staff_shifts;
  v_expected bigint;
  v_variance bigint;
  v_response jsonb;
BEGIN
  v_location_id := private.require_active_staff();
  v_actor_id := auth.uid();

  IF p_idempotency_key IS NULL OR p_correlation_id IS NULL THEN
    RAISE EXCEPTION 'idempotency and correlation ids are required' USING ERRCODE = '22023';
  END IF;

  IF p_declared_cash_centavos IS NULL OR p_declared_cash_centavos < 0 THEN
    RAISE EXCEPTION 'declared cash must be nonnegative' USING ERRCODE = '22023';
  END IF;

  v_request := jsonb_build_object(
    'shift_id', p_shift_id,
    'declared_cash_centavos', p_declared_cash_centavos,
    'notes', p_notes
  );
  v_request_hash := private.hash_idempotency_request(v_request);

  SELECT ik.*
  INTO v_existing
  FROM public.idempotency_keys ik
  WHERE ik.actor_id = v_actor_id
    AND ik.operation = 'close_staff_shift'
    AND ik.key = p_idempotency_key
  FOR UPDATE;

  IF FOUND THEN
    IF v_existing.request_hash <> v_request_hash THEN
      PERFORM private.raise_domain_error('IDEMPOTENCY_CONFLICT');
    END IF;
    RETURN v_existing.response_json;
  END IF;

  SELECT ss.*
  INTO v_shift
  FROM public.staff_shifts ss
  WHERE ss.id = p_shift_id
    AND ss.parking_location_id = v_location_id
    AND ss.profile_id = v_actor_id
  FOR UPDATE;

  IF NOT FOUND OR v_shift.status <> 'OPEN' THEN
    PERFORM private.raise_domain_error('INVALID_STATUS_TRANSITION');
  END IF;

  SELECT v_shift.opening_float_centavos + coalesce(
    sum(
      CASE
        WHEN p.kind = 'REVERSAL' THEN -coalesce(p.cash_tendered_centavos, p.amount_centavos)
        ELSE coalesce(p.cash_tendered_centavos, p.amount_centavos)
      END
    ),
    0
  )
  INTO v_expected
  FROM public.payments p
  WHERE p.staff_shift_id = v_shift.id
    AND p.parking_location_id = v_location_id;

  v_variance := p_declared_cash_centavos - v_expected;

  UPDATE public.staff_shifts ss
  SET
    status = 'CLOSED',
    closed_at = clock_timestamp(),
    expected_cash_centavos = v_expected,
    declared_cash_centavos = p_declared_cash_centavos,
    variance_centavos = v_variance,
    notes = nullif(btrim(coalesce(p_notes, '')), ''),
    updated_at = now()
  WHERE ss.id = v_shift.id
  RETURNING * INTO v_shift;

  v_response := jsonb_build_object(
    'shift_id', v_shift.id,
    'status', v_shift.status,
    'expected_cash_centavos', v_expected,
    'declared_cash_centavos', p_declared_cash_centavos,
    'variance_centavos', v_variance,
    'closed_at', v_shift.closed_at
  );

  INSERT INTO public.idempotency_keys (
    actor_id, parking_location_id, operation, key, request_hash,
    resource_id, response_json, status, expires_at
  )
  VALUES (
    v_actor_id, v_location_id, 'close_staff_shift', p_idempotency_key,
    v_request_hash, v_shift.id, v_response, 'COMPLETED',
    clock_timestamp() + interval '24 hours'
  );

  PERFORM private.write_operational_audit(
    v_location_id, v_actor_id, 'SHIFT_CLOSED', 'staff_shift', v_shift.id,
    'SUCCESS', v_shift.notes, p_correlation_id,
    jsonb_build_object('expected_cash_centavos', v_expected),
    v_response
  );

  RETURN v_response;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_parking_payment(
  p_session_id uuid,
  p_cash_tendered_centavos bigint,
  p_external_reference text,
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
  v_shift public.staff_shifts;
  v_amount_due bigint;
  v_net_collected bigint;
  v_change bigint;
  v_payment public.payments;
  v_receipt public.receipts;
  v_kind public.payment_kind;
  v_response jsonb;
  v_now timestamptz;
BEGIN
  v_location_id := private.require_active_staff();
  v_actor_id := auth.uid();
  v_now := clock_timestamp();

  IF p_idempotency_key IS NULL OR p_correlation_id IS NULL THEN
    RAISE EXCEPTION 'idempotency and correlation ids are required' USING ERRCODE = '22023';
  END IF;

  IF p_cash_tendered_centavos IS NULL OR p_cash_tendered_centavos < 0 THEN
    RAISE EXCEPTION 'cash tender must be nonnegative' USING ERRCODE = '22023';
  END IF;

  v_request := jsonb_build_object(
    'session_id', p_session_id,
    'cash_tendered_centavos', p_cash_tendered_centavos,
    'external_reference', p_external_reference
  );
  v_request_hash := private.hash_idempotency_request(v_request);

  SELECT ik.*
  INTO v_existing
  FROM public.idempotency_keys ik
  WHERE ik.actor_id = v_actor_id
    AND ik.operation = 'record_parking_payment'
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

  IF v_session.status = 'CANCELLED' THEN
    PERFORM private.raise_domain_error('SESSION_CANCELLED');
  END IF;

  IF v_session.status NOT IN ('PAYMENT_PENDING', 'PAID_AWAITING_EXIT') THEN
    PERFORM private.raise_domain_error('INVALID_STATUS_TRANSITION');
  END IF;

  v_shift := private.require_open_staff_shift(v_location_id, v_actor_id);

  IF v_session.quote_expires_at IS NOT NULL AND v_session.quote_expires_at < v_now THEN
    v_session := private.recalculate_session_quote_locked(v_session, v_location_id, v_now);
    IF v_session.status = 'PAID_AWAITING_EXIT' THEN
      UPDATE public.parking_sessions ps
      SET status = 'PAYMENT_PENDING', payment_status = 'UNPAID', version = ps.version + 1, updated_at = now()
      WHERE ps.id = v_session.id
      RETURNING * INTO v_session;
    END IF;
  END IF;

  v_net_collected := private.session_net_collected_centavos(v_session.id);
  v_amount_due := GREATEST(coalesce(v_session.total_centavos, 0) - v_net_collected, 0);

  IF v_amount_due = 0 AND v_session.status = 'PAID_AWAITING_EXIT' THEN
    PERFORM private.raise_domain_error('PAYMENT_ALREADY_RECORDED');
  END IF;

  IF p_cash_tendered_centavos < v_amount_due THEN
    PERFORM private.raise_domain_error('INSUFFICIENT_CASH');
  END IF;

  IF p_external_reference IS NOT NULL AND btrim(p_external_reference) <> '' THEN
    IF EXISTS (
      SELECT 1
      FROM public.payments p
      WHERE p.parking_location_id = v_location_id
        AND p.external_reference = btrim(p_external_reference)
    ) THEN
      PERFORM private.raise_domain_error('DUPLICATE_PAYMENT_REFERENCE');
    END IF;
  END IF;

  v_kind := CASE WHEN v_net_collected > 0 THEN 'TOP_UP'::public.payment_kind ELSE 'COLLECTION'::public.payment_kind END;
  v_change := p_cash_tendered_centavos - v_amount_due;

  INSERT INTO public.payments (
    parking_session_id,
    parking_location_id,
    staff_shift_id,
    kind,
    amount_centavos,
    cash_tendered_centavos,
    change_centavos,
    receipt_number,
    external_reference,
    processed_by
  )
  VALUES (
    v_session.id,
    v_location_id,
    v_shift.id,
    v_kind,
    v_amount_due,
    p_cash_tendered_centavos,
    v_change,
    private.generate_receipt_number(v_location_id),
    nullif(btrim(coalesce(p_external_reference, '')), ''),
    v_actor_id
  )
  RETURNING * INTO v_payment;

  INSERT INTO public.receipts (
    parking_location_id,
    payment_id,
    version,
    content_hash,
    generated_by
  )
  VALUES (
    v_location_id,
    v_payment.id,
    1,
    private.hash_json_digest(
      jsonb_build_object(
        'payment_id', v_payment.id,
        'receipt_number', v_payment.receipt_number,
        'amount_centavos', v_payment.amount_centavos,
        'session_id', v_session.id
      )
    ),
    v_actor_id
  )
  RETURNING * INTO v_receipt;

  UPDATE public.parking_sessions ps
  SET
    status = 'PAID_AWAITING_EXIT',
    payment_status = CASE WHEN coalesce(v_session.total_centavos, 0) = 0 THEN 'NOT_REQUIRED'::public.session_payment_status ELSE 'PAID'::public.session_payment_status END,
    payment_processed_by = v_actor_id,
    quote_expires_at = v_now + interval '15 minutes',
    version = ps.version + 1,
    updated_at = now()
  WHERE ps.id = v_session.id
  RETURNING * INTO v_session;

  v_response := jsonb_build_object(
    'payment_id', v_payment.id,
    'receipt_number', v_payment.receipt_number,
    'amount_centavos', v_payment.amount_centavos,
    'cash_tendered_centavos', v_payment.cash_tendered_centavos,
    'change_centavos', v_payment.change_centavos,
    'session_status', v_session.status,
    'payment_kind', v_kind
  );

  INSERT INTO public.idempotency_keys (
    actor_id, parking_location_id, operation, key, request_hash,
    resource_id, response_json, status, expires_at
  )
  VALUES (
    v_actor_id, v_location_id, 'record_parking_payment', p_idempotency_key,
    v_request_hash, v_payment.id, v_response, 'COMPLETED',
    clock_timestamp() + interval '24 hours'
  );

  PERFORM private.write_operational_audit(
    v_location_id, v_actor_id, 'PAYMENT_RECORDED', 'payment', v_payment.id,
    'SUCCESS', NULL, p_correlation_id,
    jsonb_build_object('session_id', v_session.id, 'amount_due', v_amount_due),
    v_response
  );

  RETURN v_response;
END;
$$;

CREATE OR REPLACE FUNCTION public.confirm_vehicle_exit(
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
  v_ticket public.parking_tickets%ROWTYPE;
  v_net_collected bigint;
  v_total_due bigint;
  v_now timestamptz;
  v_response jsonb;
BEGIN
  v_location_id := private.require_active_staff();
  v_actor_id := auth.uid();
  v_now := clock_timestamp();

  IF p_idempotency_key IS NULL OR p_correlation_id IS NULL THEN
    RAISE EXCEPTION 'idempotency and correlation ids are required' USING ERRCODE = '22023';
  END IF;

  v_request := jsonb_build_object('session_id', p_session_id);
  v_request_hash := private.hash_idempotency_request(v_request);

  SELECT ik.*
  INTO v_existing
  FROM public.idempotency_keys ik
  WHERE ik.actor_id = v_actor_id
    AND ik.operation = 'confirm_vehicle_exit'
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

  IF v_session.status = 'CANCELLED' THEN
    PERFORM private.raise_domain_error('SESSION_CANCELLED');
  END IF;

  IF v_session.status = 'COMPLETED' THEN
    PERFORM private.raise_domain_error('TICKET_ALREADY_COMPLETED');
  END IF;

  IF v_session.status NOT IN ('PAID_AWAITING_EXIT', 'PAYMENT_PENDING') THEN
    PERFORM private.raise_domain_error('INVALID_STATUS_TRANSITION');
  END IF;

  IF v_session.quote_expires_at IS NULL OR v_session.quote_expires_at < v_now THEN
    v_session := private.recalculate_session_quote_locked(v_session, v_location_id, v_now);
  END IF;

  v_net_collected := private.session_net_collected_centavos(v_session.id);
  v_total_due := coalesce(v_session.total_centavos, 0);

  IF v_net_collected < v_total_due THEN
    UPDATE public.parking_sessions ps
    SET
      status = 'PAYMENT_PENDING',
      payment_status = 'UNPAID',
      version = ps.version + 1,
      updated_at = now()
    WHERE ps.id = v_session.id;

    PERFORM private.raise_domain_error('PAYMENT_REQUIRED');
  END IF;

  SELECT pt.*
  INTO v_ticket
  FROM public.parking_tickets pt
  WHERE pt.parking_session_id = v_session.id
    AND pt.parking_location_id = v_location_id
    AND pt.status = 'ACTIVE'
  FOR UPDATE;

  IF NOT FOUND THEN
    PERFORM private.raise_domain_error('TICKET_INVALID');
  END IF;

  UPDATE public.parking_sessions ps
  SET
    status = 'COMPLETED',
    exit_time = v_now,
    exit_processed_by = v_actor_id,
    total_minutes = GREATEST(1, ceil(extract(epoch FROM (v_now - ps.entry_time)) / 60.0)::integer),
    version = ps.version + 1,
    updated_at = now()
  WHERE ps.id = v_session.id
  RETURNING * INTO v_session;

  UPDATE public.parking_tickets pt
  SET
    status = 'COMPLETED',
    completed_at = v_now
  WHERE pt.id = v_ticket.id;

  PERFORM private.release_occupied_space(v_session.parking_space_id, v_location_id);

  v_response := jsonb_build_object(
    'session_id', v_session.id,
    'exit_time', v_session.exit_time,
    'status', v_session.status,
    'released_space_id', v_session.parking_space_id
  );

  INSERT INTO public.idempotency_keys (
    actor_id, parking_location_id, operation, key, request_hash,
    resource_id, response_json, status, expires_at
  )
  VALUES (
    v_actor_id, v_location_id, 'confirm_vehicle_exit', p_idempotency_key,
    v_request_hash, v_session.id, v_response, 'COMPLETED',
    clock_timestamp() + interval '24 hours'
  );

  PERFORM private.write_operational_audit(
    v_location_id, v_actor_id, 'VEHICLE_EXIT_CONFIRMED', 'parking_session', v_session.id,
    'SUCCESS', NULL, p_correlation_id, NULL, v_response
  );

  RETURN v_response;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_parking_session(
  p_session_id uuid,
  p_reason text,
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
  v_ticket public.parking_tickets%ROWTYPE;
  v_response jsonb;
  v_reason text;
  v_prior_status text;
BEGIN
  v_location_id := private.require_active_staff();
  v_actor_id := auth.uid();

  IF NOT private.has_staff_permission('can_cancel_sessions') THEN
    PERFORM private.raise_domain_error('INSUFFICIENT_PERMISSION');
  END IF;

  v_reason := btrim(coalesce(p_reason, ''));
  IF char_length(v_reason) < 10 OR char_length(v_reason) > 500 THEN
    RAISE EXCEPTION 'reason length invalid' USING ERRCODE = '22023';
  END IF;

  IF p_idempotency_key IS NULL OR p_correlation_id IS NULL THEN
    RAISE EXCEPTION 'idempotency and correlation ids are required' USING ERRCODE = '22023';
  END IF;

  v_request := jsonb_build_object('session_id', p_session_id, 'reason', v_reason);
  v_request_hash := private.hash_idempotency_request(v_request);

  SELECT ik.*
  INTO v_existing
  FROM public.idempotency_keys ik
  WHERE ik.actor_id = v_actor_id
    AND ik.operation = 'cancel_parking_session'
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

  IF NOT FOUND OR v_session.status NOT IN ('ACTIVE', 'EXIT_PENDING') THEN
    PERFORM private.raise_domain_error('INVALID_STATUS_TRANSITION');
  END IF;

  IF v_session.payment_status <> 'UNPAID' OR private.session_net_collected_centavos(v_session.id) > 0 THEN
    PERFORM private.raise_domain_error('PAYMENT_REQUIRED');
  END IF;

  SELECT pt.*
  INTO v_ticket
  FROM public.parking_tickets pt
  WHERE pt.parking_session_id = v_session.id
    AND pt.status = 'ACTIVE'
  FOR UPDATE;

  IF FOUND THEN
    UPDATE public.parking_tickets pt
    SET status = 'REVOKED', revoked_at = clock_timestamp()
    WHERE pt.id = v_ticket.id;
  END IF;

  v_response := jsonb_build_object('prior_status', v_session.status);
  v_prior_status := v_session.status::text;

  UPDATE public.parking_sessions ps
  SET
    status = 'CANCELLED',
    version = ps.version + 1,
    updated_at = now()
  WHERE ps.id = v_session.id
  RETURNING * INTO v_session;

  PERFORM private.release_occupied_space(v_session.parking_space_id, v_location_id);

  v_response := jsonb_build_object(
    'session_id', v_session.id,
    'status', v_session.status,
    'released_space_id', v_session.parking_space_id
  );

  INSERT INTO public.idempotency_keys (
    actor_id, parking_location_id, operation, key, request_hash,
    resource_id, response_json, status, expires_at
  )
  VALUES (
    v_actor_id, v_location_id, 'cancel_parking_session', p_idempotency_key,
    v_request_hash, v_session.id, v_response, 'COMPLETED',
    clock_timestamp() + interval '24 hours'
  );

  PERFORM private.write_operational_audit(
    v_location_id, v_actor_id, 'SESSION_CANCELLED', 'parking_session', v_session.id,
    'SUCCESS', v_reason, p_correlation_id,
    jsonb_build_object('prior_status', v_prior_status),
    v_response
  );

  RETURN v_response;
END;
$$;

CREATE OR REPLACE FUNCTION public.process_lost_ticket(
  p_session_id uuid,
  p_evidence jsonb,
  p_reason text,
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
  v_reason text;
  v_response jsonb;
  v_correction_id uuid;
BEGIN
  v_location_id := private.require_active_staff();
  v_actor_id := auth.uid();

  IF NOT private.has_staff_permission('can_process_lost_tickets') THEN
    PERFORM private.raise_domain_error('INSUFFICIENT_PERMISSION');
  END IF;

  v_reason := btrim(coalesce(p_reason, ''));
  IF char_length(v_reason) < 10 OR char_length(v_reason) > 500 THEN
    RAISE EXCEPTION 'reason length invalid' USING ERRCODE = '22023';
  END IF;

  IF p_evidence IS NULL OR p_evidence = '{}'::jsonb THEN
    RAISE EXCEPTION 'evidence required' USING ERRCODE = '22023';
  END IF;

  IF p_idempotency_key IS NULL OR p_correlation_id IS NULL THEN
    RAISE EXCEPTION 'idempotency and correlation ids are required' USING ERRCODE = '22023';
  END IF;

  v_request := jsonb_build_object(
    'session_id', p_session_id,
    'evidence_digest', private.hash_json_digest(p_evidence),
    'reason', v_reason
  );
  v_request_hash := private.hash_idempotency_request(v_request);

  SELECT ik.*
  INTO v_existing
  FROM public.idempotency_keys ik
  WHERE ik.actor_id = v_actor_id
    AND ik.operation = 'process_lost_ticket'
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

  IF NOT FOUND OR v_session.status NOT IN ('ACTIVE', 'EXIT_PENDING') THEN
    PERFORM private.raise_domain_error('INVALID_STATUS_TRANSITION');
  END IF;

  UPDATE public.parking_sessions ps
  SET
    status = 'LOST_TICKET',
    version = ps.version + 1,
    updated_at = now()
  WHERE ps.id = v_session.id
  RETURNING * INTO v_session;

  INSERT INTO public.session_corrections (
    parking_session_id,
    parking_location_id,
    correction_type,
    before_data,
    after_data,
    reason,
    requested_by,
    approved_by,
    correlation_id
  )
  VALUES (
    v_session.id,
    v_location_id,
    'LOST_TICKET',
    jsonb_build_object('status', 'ACTIVE'),
    jsonb_build_object(
      'status', 'LOST_TICKET',
      'evidence_digest', private.hash_json_digest(p_evidence)
    ),
    v_reason,
    v_actor_id,
    v_actor_id,
    p_correlation_id
  )
  RETURNING id INTO v_correction_id;

  v_response := jsonb_build_object(
    'session_id', v_session.id,
    'status', v_session.status,
    'correction_id', v_correction_id
  );

  INSERT INTO public.idempotency_keys (
    actor_id, parking_location_id, operation, key, request_hash,
    resource_id, response_json, status, expires_at
  )
  VALUES (
    v_actor_id, v_location_id, 'process_lost_ticket', p_idempotency_key,
    v_request_hash, v_session.id, v_response, 'COMPLETED',
    clock_timestamp() + interval '24 hours'
  );

  PERFORM private.write_operational_audit(
    v_location_id, v_actor_id, 'LOST_TICKET_PROCESSED', 'parking_session', v_session.id,
    'SUCCESS', v_reason, p_correlation_id,
    jsonb_build_object('evidence_digest', private.hash_json_digest(p_evidence)),
    v_response
  );

  RETURN v_response;
END;
$$;

CREATE OR REPLACE FUNCTION public.void_parking_payment(
  p_payment_id uuid,
  p_reason text,
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
  v_payment public.payments%ROWTYPE;
  v_session public.parking_sessions%ROWTYPE;
  v_reversal public.payments;
  v_reason text;
  v_response jsonb;
BEGIN
  v_location_id := private.require_active_staff();
  v_actor_id := auth.uid();

  IF NOT private.has_staff_permission('can_void_payments') THEN
    PERFORM private.raise_domain_error('INSUFFICIENT_PERMISSION');
  END IF;

  v_reason := btrim(coalesce(p_reason, ''));
  IF char_length(v_reason) < 10 OR char_length(v_reason) > 500 THEN
    RAISE EXCEPTION 'reason length invalid' USING ERRCODE = '22023';
  END IF;

  IF p_idempotency_key IS NULL OR p_correlation_id IS NULL THEN
    RAISE EXCEPTION 'idempotency and correlation ids are required' USING ERRCODE = '22023';
  END IF;

  v_request := jsonb_build_object('payment_id', p_payment_id, 'reason', v_reason);
  v_request_hash := private.hash_idempotency_request(v_request);

  SELECT ik.*
  INTO v_existing
  FROM public.idempotency_keys ik
  WHERE ik.actor_id = v_actor_id
    AND ik.operation = 'void_parking_payment'
    AND ik.key = p_idempotency_key
  FOR UPDATE;

  IF FOUND THEN
    IF v_existing.request_hash <> v_request_hash THEN
      PERFORM private.raise_domain_error('IDEMPOTENCY_CONFLICT');
    END IF;
    RETURN v_existing.response_json;
  END IF;

  SELECT p.*
  INTO v_payment
  FROM public.payments p
  WHERE p.id = p_payment_id
    AND p.parking_location_id = v_location_id
    AND p.kind IN ('COLLECTION', 'TOP_UP')
  FOR UPDATE;

  IF NOT FOUND THEN
    PERFORM private.raise_domain_error('INVALID_STATUS_TRANSITION');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.payments p WHERE p.reverses_payment_id = v_payment.id
  ) THEN
    PERFORM private.raise_domain_error('INVALID_STATUS_TRANSITION');
  END IF;

  SELECT ps.*
  INTO v_session
  FROM public.parking_sessions ps
  WHERE ps.id = v_payment.parking_session_id
    AND ps.parking_location_id = v_location_id
  FOR UPDATE;

  IF v_session.status = 'COMPLETED' THEN
    PERFORM private.raise_domain_error('TICKET_ALREADY_COMPLETED');
  END IF;

  INSERT INTO public.payments (
    parking_session_id,
    parking_location_id,
    staff_shift_id,
    kind,
    amount_centavos,
    cash_tendered_centavos,
    change_centavos,
    receipt_number,
    reverses_payment_id,
    processed_by,
    reason
  )
  VALUES (
    v_session.id,
    v_location_id,
    v_payment.staff_shift_id,
    'REVERSAL',
    v_payment.amount_centavos,
    v_payment.cash_tendered_centavos,
    v_payment.change_centavos,
    private.generate_receipt_number(v_location_id),
    v_payment.id,
    v_actor_id,
    v_reason
  )
  RETURNING * INTO v_reversal;

  INSERT INTO public.session_corrections (
    parking_session_id,
    parking_location_id,
    correction_type,
    before_data,
    after_data,
    reason,
    requested_by,
    approved_by,
    correlation_id
  )
  VALUES (
    v_session.id,
    v_location_id,
    'PAYMENT_VOID',
    jsonb_build_object('payment_id', v_payment.id, 'amount_centavos', v_payment.amount_centavos),
    jsonb_build_object('reversal_payment_id', v_reversal.id),
    v_reason,
    v_actor_id,
    v_actor_id,
    p_correlation_id
  );

  UPDATE public.parking_sessions ps
  SET
    status = 'MANUAL_REVIEW',
    payment_status = 'VOIDED',
    version = ps.version + 1,
    updated_at = now()
  WHERE ps.id = v_session.id
  RETURNING * INTO v_session;

  v_response := jsonb_build_object(
    'payment_id', v_payment.id,
    'reversal_payment_id', v_reversal.id,
    'session_status', v_session.status
  );

  INSERT INTO public.idempotency_keys (
    actor_id, parking_location_id, operation, key, request_hash,
    resource_id, response_json, status, expires_at
  )
  VALUES (
    v_actor_id, v_location_id, 'void_parking_payment', p_idempotency_key,
    v_request_hash, v_reversal.id, v_response, 'COMPLETED',
    clock_timestamp() + interval '24 hours'
  );

  PERFORM private.write_operational_audit(
    v_location_id, v_actor_id, 'PAYMENT_VOIDED', 'payment', v_payment.id,
    'SUCCESS', v_reason, p_correlation_id,
    jsonb_build_object('original_payment_id', v_payment.id),
    v_response
  );

  RETURN v_response;
END;
$$;

CREATE OR REPLACE FUNCTION public.correct_parking_session(
  p_session_id uuid,
  p_correction_type text,
  p_values jsonb,
  p_reason text,
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
  v_reason text;
  v_before jsonb;
  v_after jsonb;
  v_correction_id uuid;
  v_response jsonb;
BEGIN
  v_location_id := private.require_active_staff();
  v_actor_id := auth.uid();
  v_reason := btrim(coalesce(p_reason, ''));

  IF char_length(v_reason) < 10 OR char_length(v_reason) > 500 THEN
    RAISE EXCEPTION 'reason length invalid' USING ERRCODE = '22023';
  END IF;

  IF p_idempotency_key IS NULL OR p_correlation_id IS NULL THEN
    RAISE EXCEPTION 'idempotency and correlation ids are required' USING ERRCODE = '22023';
  END IF;

  CASE p_correction_type
    WHEN 'DISCOUNT_PERCENT', 'COMPLIMENTARY', 'ADJUSTMENT_CENTAVOS' THEN
      IF NOT private.has_staff_permission('can_approve_overrides') THEN
        PERFORM private.raise_domain_error('INSUFFICIENT_PERMISSION');
      END IF;
    WHEN 'ENTRY_TIME' THEN
      IF NOT private.has_staff_permission('can_correct_session_times') THEN
        PERFORM private.raise_domain_error('INSUFFICIENT_PERMISSION');
      END IF;
    ELSE
      RAISE EXCEPTION 'invalid correction type' USING ERRCODE = '22023';
  END CASE;

  v_request := jsonb_build_object(
    'session_id', p_session_id,
    'correction_type', p_correction_type,
    'values', p_values,
    'reason', v_reason
  );
  v_request_hash := private.hash_idempotency_request(v_request);

  SELECT ik.*
  INTO v_existing
  FROM public.idempotency_keys ik
  WHERE ik.actor_id = v_actor_id
    AND ik.operation = 'correct_parking_session'
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

  IF NOT FOUND OR v_session.status IN ('COMPLETED', 'CANCELLED') THEN
    PERFORM private.raise_domain_error('INVALID_STATUS_TRANSITION');
  END IF;

  v_before := jsonb_build_object(
    'entry_time', v_session.entry_time,
    'total_centavos', v_session.total_centavos,
    'status', v_session.status
  );

  CASE p_correction_type
    WHEN 'DISCOUNT_PERCENT' THEN
      IF coalesce((p_values->>'discount_percent')::integer, 0) NOT BETWEEN 1 AND 100 THEN
        RAISE EXCEPTION 'invalid discount percent' USING ERRCODE = '22023';
      END IF;
      v_after := jsonb_build_object('discount_percent', (p_values->>'discount_percent')::integer);
    WHEN 'COMPLIMENTARY' THEN
      v_after := jsonb_build_object('complimentary', true);
    WHEN 'ADJUSTMENT_CENTAVOS' THEN
      v_after := jsonb_build_object('adjustment_centavos', (p_values->>'adjustment_centavos')::bigint);
    WHEN 'ENTRY_TIME' THEN
      IF p_values->>'entry_time' IS NULL THEN
        RAISE EXCEPTION 'entry_time required' USING ERRCODE = '22023';
      END IF;
      UPDATE public.parking_sessions ps
      SET entry_time = (p_values->>'entry_time')::timestamptz, version = ps.version + 1, updated_at = now()
      WHERE ps.id = v_session.id
      RETURNING * INTO v_session;
      v_after := jsonb_build_object('entry_time', v_session.entry_time);
    ELSE
      NULL;
  END CASE;

  INSERT INTO public.session_corrections (
    parking_session_id,
    parking_location_id,
    correction_type,
    before_data,
    after_data,
    reason,
    requested_by,
    approved_by,
    correlation_id
  )
  VALUES (
    v_session.id,
    v_location_id,
    p_correction_type,
    v_before,
    v_after,
    v_reason,
    v_actor_id,
    v_actor_id,
    p_correlation_id
  )
  RETURNING id INTO v_correction_id;

  IF p_correction_type IN ('DISCOUNT_PERCENT', 'COMPLIMENTARY', 'ADJUSTMENT_CENTAVOS') THEN
    v_session := private.recalculate_session_quote_locked(v_session, v_location_id, clock_timestamp());
    IF v_session.status = 'PAID_AWAITING_EXIT'
      AND private.session_net_collected_centavos(v_session.id) < coalesce(v_session.total_centavos, 0) THEN
      UPDATE public.parking_sessions ps
      SET status = 'PAYMENT_PENDING', payment_status = 'UNPAID', version = ps.version + 1, updated_at = now()
      WHERE ps.id = v_session.id
      RETURNING * INTO v_session;
    END IF;
  END IF;

  v_response := jsonb_build_object(
    'session_id', v_session.id,
    'correction_id', v_correction_id,
    'correction_type', p_correction_type,
    'status', v_session.status,
    'total_centavos', v_session.total_centavos
  );

  INSERT INTO public.idempotency_keys (
    actor_id, parking_location_id, operation, key, request_hash,
    resource_id, response_json, status, expires_at
  )
  VALUES (
    v_actor_id, v_location_id, 'correct_parking_session', p_idempotency_key,
    v_request_hash, v_correction_id, v_response, 'COMPLETED',
    clock_timestamp() + interval '24 hours'
  );

  PERFORM private.write_operational_audit(
    v_location_id, v_actor_id, 'SESSION_CORRECTED', 'parking_session', v_session.id,
    'SUCCESS', v_reason, p_correlation_id, v_before, v_response
  );

  RETURN v_response;
END;
$$;

REVOKE ALL ON FUNCTION private.generate_receipt_number(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.hash_json_digest(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.session_correction_factors(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.session_net_collected_centavos(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.require_open_staff_shift(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.recalculate_session_quote_locked(public.parking_sessions, uuid, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.release_occupied_space(uuid, uuid) FROM PUBLIC;

REVOKE ALL ON FUNCTION public.start_staff_shift(uuid, bigint, uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.close_staff_shift(uuid, bigint, text, uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_parking_payment(uuid, bigint, text, uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.confirm_vehicle_exit(uuid, uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cancel_parking_session(uuid, text, uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.process_lost_ticket(uuid, jsonb, text, uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.void_parking_payment(uuid, text, uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.correct_parking_session(uuid, text, jsonb, text, uuid, uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.start_staff_shift(uuid, bigint, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.close_staff_shift(uuid, bigint, text, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_parking_payment(uuid, bigint, text, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_vehicle_exit(uuid, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_parking_session(uuid, text, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_lost_ticket(uuid, jsonb, text, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.void_parking_payment(uuid, text, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.correct_parking_session(uuid, text, jsonb, text, uuid, uuid) TO authenticated;
