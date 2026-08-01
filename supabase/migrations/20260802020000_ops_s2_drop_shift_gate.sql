-- Phase S2: remove shift gate from record_parking_payment; staff-attributed cash only.

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

CREATE OR REPLACE FUNCTION public.list_staff_cash_totals(
  p_business_date date DEFAULT NULL
)
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
BEGIN
  v_location_id := private.require_active_staff();

  SELECT pl.timezone
  INTO v_timezone
  FROM public.parking_locations pl
  WHERE pl.id = v_location_id;

  v_business_date := COALESCE(
    p_business_date,
    (clock_timestamp() AT TIME ZONE coalesce(v_timezone, 'Asia/Manila'))::date
  );

  RETURN (
    SELECT coalesce(
      jsonb_agg(
        jsonb_build_object(
          'actor_id', totals.profile_id,
          'display_name', totals.full_name,
          'total_centavos', totals.total_centavos::text
        )
        ORDER BY totals.full_name, totals.profile_id
      ),
      '[]'::jsonb
    )
    FROM (
      SELECT
        p.processed_by AS profile_id,
        pr.full_name,
        sum(
          CASE p.kind
            WHEN 'REVERSAL'::public.payment_kind THEN -p.amount_centavos
            ELSE p.amount_centavos
          END
        ) AS total_centavos
      FROM public.payments p
      JOIN public.profiles pr
        ON pr.id = p.processed_by
       AND pr.parking_location_id = v_location_id
      WHERE p.parking_location_id = v_location_id
        AND (p.processed_at AT TIME ZONE coalesce(v_timezone, 'Asia/Manila'))::date = v_business_date
        AND p.kind IN (
          'COLLECTION'::public.payment_kind,
          'TOP_UP'::public.payment_kind,
          'REVERSAL'::public.payment_kind
        )
        AND NOT EXISTS (
          SELECT 1
          FROM public.payments rev
          WHERE rev.reverses_payment_id = p.id
            AND rev.kind = 'REVERSAL'::public.payment_kind
        )
      GROUP BY p.processed_by, pr.full_name
      HAVING sum(
        CASE p.kind
          WHEN 'REVERSAL'::public.payment_kind THEN -p.amount_centavos
          ELSE p.amount_centavos
        END
      ) <> 0
    ) totals
  );
END;
$$;

REVOKE ALL ON FUNCTION public.record_parking_payment(uuid, bigint, text, uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_staff_cash_totals(date) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.record_parking_payment(uuid, bigint, text, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_staff_cash_totals(date) TO authenticated;
