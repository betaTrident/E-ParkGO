-- Phase S3: unified settle cash and exit in one atomic RPC.

CREATE OR REPLACE FUNCTION public.settle_cash_and_exit(
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
  v_ticket public.parking_tickets%ROWTYPE;
  v_snapshot public.parking_rate_snapshots%ROWTYPE;
  v_timezone text;
  v_quote_time timestamptz;
  v_fee jsonb;
  v_total bigint;
  v_extra_penalty bigint := 0;
  v_net_collected bigint;
  v_amount_due bigint;
  v_change bigint;
  v_payment public.payments;
  v_kind public.payment_kind;
  v_now timestamptz;
  v_response jsonb;
  v_needs_quote boolean;
  v_payment_made boolean := false;
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
    AND ik.operation = 'settle_cash_and_exit'
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

  IF v_session.status NOT IN ('EXIT_PENDING', 'PAYMENT_PENDING', 'PAID_AWAITING_EXIT', 'LOST_TICKET') THEN
    PERFORM private.raise_domain_error('INVALID_STATUS_TRANSITION');
  END IF;

  v_needs_quote :=
    v_session.status IN ('EXIT_PENDING', 'LOST_TICKET')
    OR v_session.quote_expires_at IS NULL;

  IF v_needs_quote THEN
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

    v_quote_time := v_now;

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
  ELSIF v_session.quote_expires_at < v_now THEN
    v_session := private.recalculate_session_quote_locked(v_session, v_location_id, v_now);
    IF v_session.status = 'PAID_AWAITING_EXIT'
      AND private.session_net_collected_centavos(v_session.id) < coalesce(v_session.total_centavos, 0) THEN
      UPDATE public.parking_sessions ps
      SET status = 'PAYMENT_PENDING', payment_status = 'UNPAID', version = ps.version + 1, updated_at = now()
      WHERE ps.id = v_session.id
      RETURNING * INTO v_session;
    END IF;
  END IF;

  v_net_collected := private.session_net_collected_centavos(v_session.id);
  v_amount_due := GREATEST(coalesce(v_session.total_centavos, 0) - v_net_collected, 0);

  IF v_amount_due > 0 THEN
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
      NULL,
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
    );

    UPDATE public.parking_sessions ps
    SET
      status = 'PAID_AWAITING_EXIT',
      payment_status = CASE
        WHEN coalesce(v_session.total_centavos, 0) = 0 THEN 'NOT_REQUIRED'::public.session_payment_status
        ELSE 'PAID'::public.session_payment_status
      END,
      payment_processed_by = v_actor_id,
      quote_expires_at = v_now + interval '15 minutes',
      version = ps.version + 1,
      updated_at = now()
    WHERE ps.id = v_session.id
    RETURNING * INTO v_session;

    v_payment_made := true;

    PERFORM private.write_operational_audit(
      v_location_id, v_actor_id, 'PAYMENT_RECORDED', 'payment', v_payment.id,
      'SUCCESS', NULL, p_correlation_id,
      jsonb_build_object('session_id', v_session.id, 'amount_due', v_amount_due, 'settle_and_exit', true),
      jsonb_build_object(
        'payment_id', v_payment.id,
        'receipt_number', v_payment.receipt_number,
        'amount_centavos', v_payment.amount_centavos
      )
    );
  ELSIF v_amount_due = 0 AND v_session.status = 'PAYMENT_PENDING' THEN
    UPDATE public.parking_sessions ps
    SET
      status = 'PAID_AWAITING_EXIT',
      payment_status = 'NOT_REQUIRED',
      version = ps.version + 1,
      updated_at = now()
    WHERE ps.id = v_session.id
    RETURNING * INTO v_session;
  END IF;

  v_net_collected := private.session_net_collected_centavos(v_session.id);

  IF v_net_collected < coalesce(v_session.total_centavos, 0) THEN
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
    'session_status', v_session.status,
    'released_space_id', v_session.parking_space_id,
    'payment_id', CASE WHEN v_payment_made THEN to_jsonb(v_payment.id) ELSE NULL END,
    'receipt_number', CASE WHEN v_payment_made THEN to_jsonb(v_payment.receipt_number) ELSE NULL END,
    'amount_centavos', CASE WHEN v_payment_made THEN to_jsonb(v_payment.amount_centavos) ELSE NULL END,
    'cash_tendered_centavos', CASE WHEN v_payment_made THEN to_jsonb(v_payment.cash_tendered_centavos) ELSE NULL END,
    'change_centavos', CASE WHEN v_payment_made THEN to_jsonb(v_payment.change_centavos) ELSE NULL END
  );

  INSERT INTO public.idempotency_keys (
    actor_id, parking_location_id, operation, key, request_hash,
    resource_id, response_json, status, expires_at
  )
  VALUES (
    v_actor_id, v_location_id, 'settle_cash_and_exit', p_idempotency_key,
    v_request_hash, v_session.id, v_response, 'COMPLETED',
    clock_timestamp() + interval '24 hours'
  );

  PERFORM private.write_operational_audit(
    v_location_id, v_actor_id, 'VEHICLE_EXIT_CONFIRMED', 'parking_session', v_session.id,
    'SUCCESS', NULL, p_correlation_id,
    jsonb_build_object('settle_and_exit', true),
    v_response
  );

  RETURN v_response;
END;
$$;

REVOKE ALL ON FUNCTION public.settle_cash_and_exit(uuid, bigint, text, uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.settle_cash_and_exit(uuid, bigint, text, uuid, uuid) TO authenticated;
