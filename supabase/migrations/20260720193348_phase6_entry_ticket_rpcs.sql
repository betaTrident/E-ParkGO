-- Phase 6: parking entry and ticket reissue RPCs with idempotency, locking, and audit.

CREATE OR REPLACE FUNCTION private.require_active_staff()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_location_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE = '42501';
  END IF;

  IF NOT private.is_active_user() THEN
    RAISE EXCEPTION 'staff authorization required' USING ERRCODE = '42501';
  END IF;

  v_location_id := private.current_location_id();

  IF v_location_id IS NULL THEN
    RAISE EXCEPTION 'staff location context missing' USING ERRCODE = '42501';
  END IF;

  RETURN v_location_id;
END;
$$;

CREATE OR REPLACE FUNCTION private.normalize_plate_number(p_plate text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = ''
AS $$
DECLARE
  v_normalized text;
BEGIN
  v_normalized := upper(regexp_replace(btrim(coalesce(p_plate, '')), '[^A-Za-z0-9]', '', 'g'));

  IF char_length(v_normalized) < 2 OR char_length(v_normalized) > 12 THEN
    RAISE EXCEPTION 'invalid plate number' USING ERRCODE = '22023';
  END IF;

  IF v_normalized !~ '^[A-Z0-9]{2,12}$' THEN
    RAISE EXCEPTION 'invalid plate number' USING ERRCODE = '22023';
  END IF;

  RETURN v_normalized;
END;
$$;

CREATE OR REPLACE FUNCTION private.crockford_alphabet_index(p_char text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT CASE p_char
    WHEN '0' THEN 0 WHEN '1' THEN 1 WHEN '2' THEN 2 WHEN '3' THEN 3 WHEN '4' THEN 4
    WHEN '5' THEN 5 WHEN '6' THEN 6 WHEN '7' THEN 7 WHEN '8' THEN 8 WHEN '9' THEN 9
    WHEN 'A' THEN 10 WHEN 'B' THEN 11 WHEN 'C' THEN 12 WHEN 'D' THEN 13 WHEN 'E' THEN 14
    WHEN 'F' THEN 15 WHEN 'G' THEN 16 WHEN 'H' THEN 17 WHEN 'J' THEN 18 WHEN 'K' THEN 19
    WHEN 'M' THEN 20 WHEN 'N' THEN 21 WHEN 'P' THEN 22 WHEN 'Q' THEN 23 WHEN 'R' THEN 24
    WHEN 'S' THEN 25 WHEN 'T' THEN 26 WHEN 'V' THEN 27 WHEN 'W' THEN 28 WHEN 'X' THEN 29
    WHEN 'Y' THEN 30 WHEN 'Z' THEN 31
    ELSE -1
  END;
$$;

CREATE OR REPLACE FUNCTION private.crockford_random(p_length integer)
RETURNS text
LANGUAGE plpgsql
VOLATILE
SET search_path = ''
AS $$
DECLARE
  v_alphabet constant text := '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  v_result text := '';
  v_index integer;
  v_byte integer;
BEGIN
  WHILE char_length(v_result) < p_length LOOP
    v_byte := get_byte(extensions.gen_random_bytes(1), 0);
    v_index := (v_byte % 32) + 1;
    v_result := v_result || substr(v_alphabet, v_index, 1);
  END LOOP;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION private.crockford_check_character(p_body text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = ''
AS $$
DECLARE
  v_alphabet constant text := '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  v_sum integer := 0;
  v_position integer;
  v_char text;
BEGIN
  FOR v_position IN 1..char_length(p_body) LOOP
    v_char := substr(p_body, v_position, 1);
    v_sum := v_sum + private.crockford_alphabet_index(v_char);
  END LOOP;

  RETURN substr(v_alphabet, (v_sum % 32) + 1, 1);
END;
$$;

CREATE OR REPLACE FUNCTION private.generate_ticket_number(p_location_id uuid)
RETURNS text
LANGUAGE plpgsql
VOLATILE
SET search_path = ''
AS $$
DECLARE
  v_prefix text;
  v_body text;
  v_ticket text;
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
    v_body := private.crockford_random(8);
    v_ticket := upper(
      v_prefix
      || '-'
      || to_char(clock_timestamp() AT TIME ZONE 'Asia/Manila', 'YYMMDD')
      || '-'
      || v_body
      || private.crockford_check_character(v_body)
    );

    EXIT WHEN NOT EXISTS (
      SELECT 1
      FROM public.parking_tickets pt
      WHERE pt.ticket_number = v_ticket
    );

    IF v_attempts > 25 THEN
      RAISE EXCEPTION 'unable to allocate ticket number' USING ERRCODE = 'P0001';
    END IF;
  END LOOP;

  RETURN v_ticket;
END;
$$;

CREATE OR REPLACE FUNCTION private.generate_qr_token()
RETURNS text
LANGUAGE sql
VOLATILE
SET search_path = ''
AS $$
  SELECT replace(
    replace(
      rtrim(encode(extensions.gen_random_bytes(32), 'base64'), '='),
      '+',
      '-'
    ),
    '/',
    '_'
  );
$$;

CREATE OR REPLACE FUNCTION private.hash_qr_token(p_token text)
RETURNS bytea
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT extensions.digest(
    decode(
      rpad(
        replace(replace(p_token, '-', '+'), '_', '/'),
        (4 - (length(p_token) % 4)) % 4 + length(p_token),
        '='
      ),
      'base64'
    ),
    'sha256'
  );
$$;

CREATE OR REPLACE FUNCTION private.hash_idempotency_request(p_payload jsonb)
RETURNS bytea
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT extensions.digest(convert_to(p_payload::text, 'UTF8'), 'sha256');
$$;

CREATE OR REPLACE FUNCTION private.raise_domain_error(p_code text)
RETURNS void
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  RAISE EXCEPTION '%', p_code USING ERRCODE = 'P0001';
END;
$$;

CREATE OR REPLACE FUNCTION private.find_effective_parking_rate(
  p_location_id uuid,
  p_vehicle_type_id uuid,
  p_as_of timestamptz
)
RETURNS public.parking_rates
LANGUAGE plpgsql
STABLE
SET search_path = ''
AS $$
DECLARE
  v_rate public.parking_rates;
BEGIN
  SELECT pr.*
  INTO v_rate
  FROM public.parking_rates pr
  WHERE pr.parking_location_id = p_location_id
    AND pr.is_published = true
    AND pr.effective_from <= p_as_of
    AND (pr.effective_to IS NULL OR pr.effective_to > p_as_of)
    AND pr.vehicle_type_id = p_vehicle_type_id
  ORDER BY pr.version DESC
  LIMIT 1;

  IF FOUND THEN
    RETURN v_rate;
  END IF;

  SELECT pr.*
  INTO v_rate
  FROM public.parking_rates pr
  WHERE pr.parking_location_id = p_location_id
    AND pr.is_published = true
    AND pr.effective_from <= p_as_of
    AND (pr.effective_to IS NULL OR pr.effective_to > p_as_of)
    AND pr.vehicle_type_id IS NULL
  ORDER BY pr.version DESC
  LIMIT 1;

  IF NOT FOUND THEN
    PERFORM private.raise_domain_error('RATE_NOT_CONFIGURED');
  END IF;

  RETURN v_rate;
END;
$$;

CREATE OR REPLACE FUNCTION private.build_rate_snapshot_payload(p_rate public.parking_rates)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT jsonb_build_object(
    'parking_rate_id', p_rate.id,
    'rate_version', p_rate.version,
    'mode', p_rate.mode,
    'grace_minutes', p_rate.grace_minutes,
    'initial_minutes', p_rate.initial_minutes,
    'initial_fee_centavos', p_rate.initial_fee_centavos,
    'succeeding_interval_minutes', p_rate.succeeding_interval_minutes,
    'succeeding_fee_centavos', p_rate.succeeding_fee_centavos,
    'flat_fee_centavos', p_rate.flat_fee_centavos,
    'daily_max_centavos', p_rate.daily_max_centavos,
    'overnight_fee_centavos', p_rate.overnight_fee_centavos,
    'lost_ticket_penalty_centavos', p_rate.lost_ticket_penalty_centavos,
    'effective_from', p_rate.effective_from,
    'effective_to', p_rate.effective_to
  );
$$;

CREATE OR REPLACE FUNCTION private.sanitize_entry_response(p_response jsonb)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT (p_response - 'qr_payload')
    || jsonb_build_object('credential_recovery', 'REISSUE_REQUIRED');
$$;

CREATE OR REPLACE FUNCTION private.write_operational_audit(
  p_location_id uuid,
  p_actor_id uuid,
  p_action text,
  p_target_type text,
  p_target_id uuid,
  p_result text,
  p_reason text,
  p_correlation_id uuid,
  p_before_data jsonb,
  p_after_data jsonb
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  INSERT INTO public.audit_logs (
    parking_location_id,
    actor_id,
    action,
    target_type,
    target_id,
    result,
    reason,
    correlation_id,
    before_data,
    after_data
  )
  VALUES (
    p_location_id,
    p_actor_id,
    p_action,
    p_target_type,
    p_target_id,
    p_result,
    p_reason,
    p_correlation_id,
    p_before_data,
    p_after_data
  );
$$;

CREATE OR REPLACE FUNCTION public.create_parking_entry(
  p_plate text,
  p_vehicle_type_id uuid,
  p_color text,
  p_space_id uuid,
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
  v_space public.parking_spaces%ROWTYPE;
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
    'color', v_color,
    'space_id', p_space_id
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

  SELECT ps.*
  INTO v_space
  FROM public.parking_spaces ps
  WHERE ps.id = p_space_id
    AND ps.parking_location_id = v_location_id
  FOR UPDATE;

  IF NOT FOUND OR v_space.is_active = false THEN
    PERFORM private.raise_domain_error('SPACE_NOT_AVAILABLE');
  END IF;

  IF v_space.status <> 'AVAILABLE'::public.space_status THEN
    PERFORM private.raise_domain_error('SPACE_NOT_AVAILABLE');
  END IF;

  IF v_space.vehicle_type_id IS NOT NULL
     AND v_space.vehicle_type_id <> p_vehicle_type_id THEN
    PERFORM private.raise_domain_error('SPACE_NOT_AVAILABLE');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.vehicle_types vt
    WHERE vt.id = p_vehicle_type_id
      AND vt.parking_location_id = v_location_id
      AND vt.is_active = true
  ) THEN
    PERFORM private.raise_domain_error('SPACE_NOT_AVAILABLE');
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
    p_space_id,
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

  UPDATE public.parking_spaces ps
  SET
    status = 'OCCUPIED',
    version = ps.version + 1,
    updated_at = now()
  WHERE ps.id = p_space_id
    AND ps.parking_location_id = v_location_id;

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
      'space_id', p_space_id,
      'vehicle_id', v_vehicle_id
    )
  );

  RETURN v_response;
END;
$$;

CREATE OR REPLACE FUNCTION public.reissue_parking_ticket(
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
  v_reason text;
  v_request jsonb;
  v_request_hash bytea;
  v_existing public.idempotency_keys%ROWTYPE;
  v_session public.parking_sessions%ROWTYPE;
  v_ticket public.parking_tickets%ROWTYPE;
  v_qr_token text;
  v_qr_hash bytea;
  v_new_ticket_id uuid;
  v_new_ticket_number text;
  v_response jsonb;
  v_sanitized jsonb;
  v_has_idempotency boolean := false;
BEGIN
  v_location_id := private.require_active_staff();
  v_actor_id := auth.uid();
  v_reason := btrim(coalesce(p_reason, ''));

  IF char_length(v_reason) < 10 OR char_length(v_reason) > 500 THEN
    RAISE EXCEPTION 'reissue reason must be between 10 and 500 characters' USING ERRCODE = '22023';
  END IF;

  IF p_idempotency_key IS NULL OR p_correlation_id IS NULL THEN
    RAISE EXCEPTION 'idempotency and correlation ids are required' USING ERRCODE = '22023';
  END IF;

  v_request := jsonb_build_object(
    'session_id', p_session_id,
    'reason', v_reason
  );
  v_request_hash := private.hash_idempotency_request(v_request);

  SELECT ik.*
  INTO v_existing
  FROM public.idempotency_keys ik
  WHERE ik.actor_id = v_actor_id
    AND ik.operation = 'reissue_parking_ticket'
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

  SELECT ps.*
  INTO v_session
  FROM public.parking_sessions ps
  WHERE ps.id = p_session_id
    AND ps.parking_location_id = v_location_id
  FOR UPDATE;

  IF NOT FOUND THEN
    PERFORM private.raise_domain_error('TICKET_INVALID');
  END IF;

  IF v_session.status NOT IN (
    'ACTIVE', 'EXIT_PENDING', 'PAYMENT_PENDING',
    'PAID_AWAITING_EXIT', 'LOST_TICKET', 'MANUAL_REVIEW'
  ) THEN
    PERFORM private.raise_domain_error('INVALID_STATUS_TRANSITION');
  END IF;

  SELECT pt.*
  INTO v_ticket
  FROM public.parking_tickets pt
  WHERE pt.parking_session_id = p_session_id
    AND pt.parking_location_id = v_location_id
    AND pt.status = 'ACTIVE'
  FOR UPDATE;

  IF NOT FOUND THEN
    PERFORM private.raise_domain_error('TICKET_INVALID');
  END IF;

  UPDATE public.parking_tickets pt
  SET
    status = 'REVOKED',
    revoked_at = clock_timestamp()
  WHERE pt.id = v_ticket.id;

  v_qr_token := private.generate_qr_token();
  v_qr_hash := private.hash_qr_token(v_qr_token);
  v_new_ticket_number := private.generate_ticket_number(v_location_id);

  INSERT INTO public.parking_tickets (
    parking_session_id,
    parking_location_id,
    ticket_number,
    qr_token_hash,
    status,
    reissue_of_ticket_id,
    issued_at
  )
  VALUES (
    p_session_id,
    v_location_id,
    v_new_ticket_number,
    v_qr_hash,
    'ACTIVE',
    v_ticket.id,
    clock_timestamp()
  )
  RETURNING id INTO v_new_ticket_id;

  v_response := jsonb_build_object(
    'session_id', p_session_id,
    'ticket_id', v_new_ticket_id,
    'ticket_number', v_new_ticket_number,
    'qr_payload', 'https://app.local/verify#v1.' || v_qr_token,
    'entry_time', v_session.entry_time,
    'status', v_session.status::text,
    'reissued_from_ticket_id', v_ticket.id
  );

  v_sanitized := private.sanitize_entry_response(v_response);

  IF v_has_idempotency THEN
    UPDATE public.idempotency_keys ik
    SET
      request_hash = v_request_hash,
      resource_id = v_new_ticket_id,
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
      'reissue_parking_ticket',
      p_idempotency_key,
      v_request_hash,
      v_new_ticket_id,
      v_sanitized,
      'COMPLETED',
      clock_timestamp() + interval '24 hours'
    );
  END IF;

  PERFORM private.write_operational_audit(
    v_location_id,
    v_actor_id,
    'PARKING_TICKET_REISSUED',
    'parking_ticket',
    v_new_ticket_id,
    'SUCCESS',
    v_reason,
    p_correlation_id,
    jsonb_build_object('ticket_id', v_ticket.id, 'ticket_number', v_ticket.ticket_number),
    jsonb_build_object('ticket_id', v_new_ticket_id, 'ticket_number', v_new_ticket_number)
  );

  RETURN v_response;
END;
$$;

REVOKE ALL ON FUNCTION private.require_active_staff() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.normalize_plate_number(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.crockford_alphabet_index(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.crockford_random(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.crockford_check_character(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.generate_ticket_number(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.generate_qr_token() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.hash_qr_token(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.hash_idempotency_request(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.raise_domain_error(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.find_effective_parking_rate(uuid, uuid, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.build_rate_snapshot_payload(public.parking_rates) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.sanitize_entry_response(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.write_operational_audit(uuid, uuid, text, text, uuid, text, text, uuid, jsonb, jsonb) FROM PUBLIC;

REVOKE ALL ON FUNCTION public.create_parking_entry(text, uuid, text, uuid, uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reissue_parking_ticket(uuid, text, uuid, uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_parking_entry(text, uuid, text, uuid, uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reissue_parking_ticket(uuid, text, uuid, uuid) TO authenticated, service_role;
