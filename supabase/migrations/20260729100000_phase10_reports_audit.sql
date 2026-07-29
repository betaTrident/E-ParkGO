-- Phase 10: transactions, reports, shift history, audit search, and export audit RPCs.

CREATE OR REPLACE FUNCTION private.validate_report_date_range(
  p_from date,
  p_to date,
  p_max_days integer
)
RETURNS void
LANGUAGE plpgsql
IMMUTABLE
SET search_path = ''
AS $$
BEGIN
  IF p_from IS NULL OR p_to IS NULL THEN
    RAISE EXCEPTION 'from and to dates are required' USING ERRCODE = '22023';
  END IF;

  IF p_from > p_to THEN
    RAISE EXCEPTION 'from date must be on or before to date' USING ERRCODE = '22023';
  END IF;

  IF (p_to - p_from) > p_max_days THEN
    RAISE EXCEPTION 'date range exceeds % day limit', p_max_days USING ERRCODE = '22023';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION private.redact_audit_jsonb(p_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
SET search_path = ''
AS $$
DECLARE
  v_key text;
  v_sensitive text[] := ARRAY[
    'qr_token_hash', 'token', 'password', 'secret', 'hash', 'credential',
    'qr_payload', 'encrypted_password', 'raw_token', 'api_key', 'qr_token',
    'access_token', 'refresh_token', 'authorization'
  ];
  v_result jsonb := coalesce(p_data, '{}'::jsonb);
BEGIN
  IF jsonb_typeof(v_result) <> 'object' THEN
    RETURN v_result;
  END IF;

  FOREACH v_key IN ARRAY v_sensitive LOOP
    IF v_result ? v_key THEN
      v_result := v_result - v_key;
    END IF;
  END LOOP;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION private.decode_report_cursor(p_cursor text)
RETURNS TABLE (cursor_ts timestamptz, cursor_id text)
LANGUAGE plpgsql
IMMUTABLE
SET search_path = ''
AS $$
DECLARE
  v_payload text;
  v_parts text[];
BEGIN
  IF p_cursor IS NULL OR btrim(p_cursor) = '' THEN
    RETURN;
  END IF;

  BEGIN
    v_payload := convert_from(decode(p_cursor, 'base64'), 'UTF8');
  EXCEPTION
    WHEN others THEN
      RAISE EXCEPTION 'invalid cursor' USING ERRCODE = '22023';
  END;

  v_parts := string_to_array(v_payload, '|');
  IF coalesce(array_length(v_parts, 1), 0) <> 2 THEN
    RAISE EXCEPTION 'invalid cursor' USING ERRCODE = '22023';
  END IF;

  cursor_ts := v_parts[1]::timestamptz;
  cursor_id := v_parts[2];
  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION private.encode_report_cursor(p_ts timestamptz, p_id text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT encode(convert_to(p_ts::text || '|' || p_id, 'UTF8'), 'base64');
$$;

CREATE OR REPLACE FUNCTION private.location_net_revenue_centavos(
  p_location_id uuid,
  p_from_ts timestamptz,
  p_to_ts timestamptz
)
RETURNS bigint
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT coalesce(
    sum(
      CASE p.kind
        WHEN 'REVERSAL'::public.payment_kind THEN -p.amount_centavos
        ELSE p.amount_centavos
      END
    ),
    0
  )
  FROM public.payments p
  WHERE p.parking_location_id = p_location_id
    AND p.processed_at >= p_from_ts
    AND p.processed_at < p_to_ts
    AND p.kind IN ('COLLECTION'::public.payment_kind, 'TOP_UP'::public.payment_kind, 'REVERSAL'::public.payment_kind);
$$;

CREATE OR REPLACE FUNCTION private.report_bounds(
  p_from date,
  p_to date,
  p_timezone text
)
RETURNS TABLE (range_start timestamptz, range_end timestamptz)
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT
    (p_from::timestamp AT TIME ZONE p_timezone),
    ((p_to + 1)::timestamp AT TIME ZONE p_timezone);
$$;

CREATE OR REPLACE FUNCTION public.list_transactions(
  p_from date,
  p_to date,
  p_status text DEFAULT NULL,
  p_plate text DEFAULT NULL,
  p_cursor text DEFAULT NULL,
  p_limit integer DEFAULT 25
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
  v_limit integer;
  v_range_start timestamptz;
  v_range_end timestamptz;
  v_cursor_ts timestamptz;
  v_cursor_id text;
  v_plate text;
  v_items jsonb;
  v_has_more boolean;
  v_next_cursor text;
  v_last_ts timestamptz;
  v_last_id text;
BEGIN
  v_location_id := private.require_active_staff();
  v_limit := least(greatest(coalesce(p_limit, 25), 1), 100);
  PERFORM private.validate_report_date_range(p_from, p_to, 90);

  SELECT pl.timezone
  INTO v_timezone
  FROM public.parking_locations pl
  WHERE pl.id = v_location_id;

  SELECT rb.range_start, rb.range_end
  INTO v_range_start, v_range_end
  FROM private.report_bounds(p_from, p_to, v_timezone) rb;

  IF p_cursor IS NOT NULL AND btrim(p_cursor) <> '' THEN
    SELECT d.cursor_ts, d.cursor_id
    INTO v_cursor_ts, v_cursor_id
    FROM private.decode_report_cursor(p_cursor) d;

    IF v_cursor_ts IS NULL THEN
      RAISE EXCEPTION 'invalid cursor' USING ERRCODE = '22023';
    END IF;
  END IF;

  IF p_plate IS NOT NULL AND btrim(p_plate) <> '' THEN
    v_plate := private.normalize_plate_number(p_plate);
  END IF;

  WITH filtered AS (
    SELECT
      p.id AS payment_id,
      p.receipt_number,
      p.kind::text AS payment_kind,
      p.amount_centavos,
      p.processed_at,
      ps.id AS session_id,
      ps.status::text AS session_status,
      v.display_plate_number AS plate_display
    FROM public.payments p
    JOIN public.parking_sessions ps
      ON ps.id = p.parking_session_id
     AND ps.parking_location_id = p.parking_location_id
    JOIN public.vehicles v
      ON v.id = ps.vehicle_id
     AND v.parking_location_id = ps.parking_location_id
    WHERE p.parking_location_id = v_location_id
      AND p.processed_at >= v_range_start
      AND p.processed_at < v_range_end
      AND (
        p_status IS NULL
        OR btrim(p_status) = ''
        OR ps.status::text = upper(btrim(p_status))
      )
      AND (
        v_plate IS NULL
        OR v.normalized_plate_number = v_plate
      )
      AND (
        v_cursor_ts IS NULL
        OR (p.processed_at, p.id::text) < (v_cursor_ts, v_cursor_id)
      )
    ORDER BY p.processed_at DESC, p.id DESC
    LIMIT v_limit + 1
  ),
  page AS (
    SELECT *
    FROM filtered
    LIMIT v_limit
  )
  SELECT
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'payment_id', page.payment_id,
          'receipt_number', page.receipt_number,
          'payment_kind', page.payment_kind,
          'amount_centavos', page.amount_centavos::text,
          'processed_at', page.processed_at,
          'session_id', page.session_id,
          'session_status', page.session_status,
          'plate_display', page.plate_display
        )
        ORDER BY page.processed_at DESC, page.payment_id DESC
      ),
      '[]'::jsonb
    ),
    (SELECT count(*) FROM filtered) > v_limit,
    (SELECT page.processed_at FROM page ORDER BY page.processed_at ASC, page.payment_id ASC LIMIT 1),
    (SELECT page.payment_id::text FROM page ORDER BY page.processed_at ASC, page.payment_id ASC LIMIT 1)
  INTO v_items, v_has_more, v_last_ts, v_last_id
  FROM page;

  IF v_has_more IS TRUE AND v_last_ts IS NOT NULL THEN
    v_next_cursor := private.encode_report_cursor(v_last_ts, v_last_id);
  END IF;

  RETURN jsonb_build_object(
    'items', v_items,
    'pagination', jsonb_build_object(
      'limit', v_limit,
      'next_cursor', v_next_cursor
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_report_preview(
  p_report_type text,
  p_from date,
  p_to date
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
  v_range_start timestamptz;
  v_range_end timestamptz;
  v_type text := upper(btrim(coalesce(p_report_type, '')));
  v_summary jsonb;
  v_net bigint;
  v_entries integer;
  v_exits integer;
  v_shift_count integer;
  v_avg_bps integer;
BEGIN
  v_location_id := private.require_active_staff();
  PERFORM private.validate_report_date_range(p_from, p_to, 90);

  SELECT pl.timezone
  INTO v_timezone
  FROM public.parking_locations pl
  WHERE pl.id = v_location_id;

  SELECT rb.range_start, rb.range_end
  INTO v_range_start, v_range_end
  FROM private.report_bounds(p_from, p_to, v_timezone) rb;

  IF v_type = 'DAILY_REVENUE' THEN
    v_net := private.location_net_revenue_centavos(v_location_id, v_range_start, v_range_end);
    v_summary := jsonb_build_object(
      'net_revenue_centavos', v_net::text,
      'collections_centavos', (
        SELECT coalesce(sum(p.amount_centavos), 0)::text
        FROM public.payments p
        WHERE p.parking_location_id = v_location_id
          AND p.processed_at >= v_range_start
          AND p.processed_at < v_range_end
          AND p.kind IN ('COLLECTION'::public.payment_kind, 'TOP_UP'::public.payment_kind)
      ),
      'reversals_centavos', (
        SELECT coalesce(sum(p.amount_centavos), 0)::text
        FROM public.payments p
        WHERE p.parking_location_id = v_location_id
          AND p.processed_at >= v_range_start
          AND p.processed_at < v_range_end
          AND p.kind = 'REVERSAL'::public.payment_kind
      )
    );
  ELSIF v_type = 'MOVEMENTS' THEN
    SELECT count(*)::integer
    INTO v_entries
    FROM public.parking_sessions s
    WHERE s.parking_location_id = v_location_id
      AND s.entry_time >= v_range_start
      AND s.entry_time < v_range_end;

    SELECT count(*)::integer
    INTO v_exits
    FROM public.parking_sessions s
    WHERE s.parking_location_id = v_location_id
      AND s.exit_time IS NOT NULL
      AND s.exit_time >= v_range_start
      AND s.exit_time < v_range_end;

    v_summary := jsonb_build_object(
      'entries', v_entries,
      'exits', v_exits
    );
  ELSIF v_type = 'OCCUPANCY' THEN
    SELECT coalesce(avg(daily_bps)::integer, 0)
    INTO v_avg_bps
    FROM (
      SELECT (
        CASE
          WHEN capacity.operational_capacity = 0 THEN 0
          ELSE ((occupied.occupied_count * 10000) / capacity.operational_capacity)
        END
      ) AS daily_bps
      FROM generate_series(p_from, p_to, interval '1 day') AS bucket_day(bucket_day)
      CROSS JOIN LATERAL (
        SELECT GREATEST(
          count(*) - count(*) FILTER (WHERE ps.status = 'OUT_OF_SERVICE'::public.space_status),
          0
        )::integer AS operational_capacity
        FROM public.parking_spaces ps
        WHERE ps.parking_location_id = v_location_id
          AND ps.is_active = true
      ) capacity
      CROSS JOIN LATERAL (
        SELECT count(*)::integer AS occupied_count
        FROM public.parking_sessions s
        WHERE s.parking_location_id = v_location_id
          AND s.entry_time < ((bucket_day.bucket_day::date + 1)::timestamp AT TIME ZONE v_timezone)
          AND coalesce(s.exit_time, v_range_end) >= (bucket_day.bucket_day::date::timestamp AT TIME ZONE v_timezone)
          AND s.status <> 'CANCELLED'::public.session_status
      ) occupied
    ) daily;

    v_summary := jsonb_build_object(
      'average_occupancy_bps', v_avg_bps
    );
  ELSIF v_type = 'SHIFT_RECONCILIATION' THEN
    SELECT count(*)::integer
    INTO v_shift_count
    FROM public.staff_shifts ss
    WHERE ss.parking_location_id = v_location_id
      AND ss.opened_at >= v_range_start
      AND ss.opened_at < v_range_end;

    v_summary := jsonb_build_object(
      'shift_count', v_shift_count,
      'total_variance_centavos', (
        SELECT coalesce(sum(ss.variance_centavos), 0)::text
        FROM public.staff_shifts ss
        WHERE ss.parking_location_id = v_location_id
          AND ss.opened_at >= v_range_start
          AND ss.opened_at < v_range_end
          AND ss.status = 'CLOSED'::public.shift_status
      )
    );
  ELSE
    RAISE EXCEPTION 'unsupported report type' USING ERRCODE = '22023';
  END IF;

  RETURN jsonb_build_object(
    'report_type', v_type,
    'from', p_from,
    'to', p_to,
    'timezone', v_timezone,
    'location_id', v_location_id,
    'summary', v_summary
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.export_report(
  p_report_type text,
  p_from date,
  p_to date,
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
  v_timezone text;
  v_type text := upper(btrim(coalesce(p_report_type, '')));
  v_request jsonb;
  v_request_hash bytea;
  v_existing public.idempotency_keys%ROWTYPE;
  v_preview jsonb;
  v_rows jsonb;
  v_export_id uuid := gen_random_uuid();
  v_audit_id bigint;
  v_response jsonb;
BEGIN
  IF NOT private.is_active_user() OR NOT private.is_admin() THEN
    RAISE EXCEPTION 'INSUFFICIENT_PERMISSION' USING ERRCODE = '42501';
  END IF;

  v_location_id := private.current_location_id();
  v_actor_id := auth.uid();

  IF p_idempotency_key IS NULL OR p_correlation_id IS NULL THEN
    RAISE EXCEPTION 'idempotency and correlation ids are required' USING ERRCODE = '22023';
  END IF;

  PERFORM private.validate_report_date_range(p_from, p_to, 366);

  v_request := jsonb_build_object(
    'report_type', v_type,
    'from', p_from,
    'to', p_to
  );
  v_request_hash := private.hash_idempotency_request(v_request);

  SELECT ik.*
  INTO v_existing
  FROM public.idempotency_keys ik
  WHERE ik.actor_id = v_actor_id
    AND ik.operation = 'export_report'
    AND ik.key = p_idempotency_key
  FOR UPDATE;

  IF FOUND THEN
    IF v_existing.request_hash <> v_request_hash THEN
      RAISE EXCEPTION 'IDEMPOTENCY_CONFLICT' USING ERRCODE = 'P0001';
    END IF;
  END IF;

  IF v_existing.id IS NOT NULL AND v_existing.status = 'COMPLETED' THEN
    RETURN v_existing.response_json;
  END IF;

  IF v_existing.id IS NULL THEN
    INSERT INTO public.idempotency_keys (
      actor_id,
      parking_location_id,
      operation,
      key,
      request_hash,
      status,
      expires_at
    )
    VALUES (
      v_actor_id,
      v_location_id,
      'export_report',
      p_idempotency_key,
      v_request_hash,
      'IN_PROGRESS',
      now() + interval '24 hours'
    );
  END IF;

  v_preview := public.get_report_preview(v_type, p_from, p_to);

  IF v_type = 'DAILY_REVENUE' THEN
    v_rows := jsonb_build_array(
      jsonb_build_object(
        'business_date', p_from::text,
        'net_revenue_centavos', v_preview->'summary'->>'net_revenue_centavos',
        'collections_centavos', v_preview->'summary'->>'collections_centavos',
        'reversals_centavos', v_preview->'summary'->>'reversals_centavos'
      )
    );
  ELSIF v_type IN ('MOVEMENTS', 'OCCUPANCY', 'SHIFT_RECONCILIATION') THEN
    v_rows := jsonb_build_array(v_preview->'summary');
  ELSE
    RAISE EXCEPTION 'unsupported report type' USING ERRCODE = '22023';
  END IF;

  PERFORM private.write_operational_audit(
    v_location_id,
    v_actor_id,
    'REPORT_EXPORT',
    'report_export',
    v_export_id,
    'SUCCESS',
    format('%s export %s to %s', v_type, p_from, p_to),
    p_correlation_id,
    NULL,
    jsonb_build_object(
      'report_type', v_type,
      'from', p_from,
      'to', p_to,
      'row_count', jsonb_array_length(v_rows),
      'export_id', v_export_id
    )
  );

  SELECT al.id
  INTO v_audit_id
  FROM public.audit_logs al
  WHERE al.correlation_id = p_correlation_id
    AND al.action = 'REPORT_EXPORT'
  ORDER BY al.created_at DESC
  LIMIT 1;

  v_response := jsonb_build_object(
    'export_id', v_export_id,
    'audit_log_id', v_audit_id,
    'report_type', v_type,
    'from', p_from,
    'to', p_to,
    'timezone', v_preview->>'timezone',
    'rows', v_rows,
    'row_count', jsonb_array_length(v_rows)
  );

  UPDATE public.idempotency_keys ik
  SET
    status = 'COMPLETED',
    response_json = v_response,
    resource_id = v_export_id,
    updated_at = now()
  WHERE ik.actor_id = v_actor_id
    AND ik.operation = 'export_report'
    AND ik.key = p_idempotency_key;

  RETURN v_response;
END;
$$;

CREATE OR REPLACE FUNCTION public.search_audit_logs(
  p_from timestamptz,
  p_to timestamptz,
  p_action text DEFAULT NULL,
  p_actor_id uuid DEFAULT NULL,
  p_correlation_id uuid DEFAULT NULL,
  p_cursor text DEFAULT NULL,
  p_limit integer DEFAULT 25
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_location_id uuid;
  v_limit integer;
  v_cursor_ts timestamptz;
  v_cursor_id text;
  v_items jsonb;
  v_has_more boolean;
  v_last_ts timestamptz;
  v_last_id text;
BEGIN
  IF NOT private.is_active_user() OR NOT private.is_admin() THEN
    RAISE EXCEPTION 'INSUFFICIENT_PERMISSION' USING ERRCODE = '42501';
  END IF;

  v_location_id := private.current_location_id();
  v_limit := least(greatest(coalesce(p_limit, 25), 1), 100);

  IF p_from IS NULL OR p_to IS NULL OR p_from > p_to THEN
    RAISE EXCEPTION 'invalid audit time range' USING ERRCODE = '22023';
  END IF;

  IF p_cursor IS NOT NULL AND btrim(p_cursor) <> '' THEN
    SELECT d.cursor_ts, d.cursor_id
    INTO v_cursor_ts, v_cursor_id
    FROM private.decode_report_cursor(p_cursor) d;
  END IF;

  WITH filtered AS (
    SELECT
      al.id,
      al.created_at,
      al.action,
      al.target_type,
      al.target_id,
      al.result,
      al.reason,
      al.correlation_id,
      al.actor_id,
      private.redact_audit_jsonb(al.before_data) AS before_data,
      private.redact_audit_jsonb(al.after_data) AS after_data
    FROM public.audit_logs al
    WHERE al.parking_location_id = v_location_id
      AND al.created_at >= p_from
      AND al.created_at <= p_to
      AND (p_action IS NULL OR btrim(p_action) = '' OR al.action = upper(btrim(p_action)))
      AND (p_actor_id IS NULL OR al.actor_id = p_actor_id)
      AND (p_correlation_id IS NULL OR al.correlation_id = p_correlation_id)
      AND (
        v_cursor_ts IS NULL
        OR (al.created_at, al.id::text) < (v_cursor_ts, v_cursor_id)
      )
    ORDER BY al.created_at DESC, al.id DESC
    LIMIT v_limit + 1
  ),
  page AS (
    SELECT *
    FROM filtered
    LIMIT v_limit
  )
  SELECT
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', page.id,
          'created_at', page.created_at,
          'action', page.action,
          'target_type', page.target_type,
          'target_id', page.target_id,
          'result', page.result,
          'reason', page.reason,
          'correlation_id', page.correlation_id,
          'actor_id', page.actor_id,
          'before_data', page.before_data,
          'after_data', page.after_data
        )
        ORDER BY page.created_at DESC, page.id DESC
      ),
      '[]'::jsonb
    ),
    (SELECT count(*) FROM filtered) > v_limit,
    (SELECT page.created_at FROM page ORDER BY page.created_at ASC, page.id ASC LIMIT 1),
    (SELECT page.id::text FROM page ORDER BY page.created_at ASC, page.id ASC LIMIT 1)
  INTO v_items, v_has_more, v_last_ts, v_last_id
  FROM page;

  RETURN jsonb_build_object(
    'items', v_items,
    'pagination', jsonb_build_object(
      'limit', v_limit,
      'next_cursor', CASE
        WHEN v_has_more IS TRUE AND v_last_ts IS NOT NULL THEN private.encode_report_cursor(v_last_ts, v_last_id)
        ELSE NULL
      END
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.list_shift_history(
  p_cursor text DEFAULT NULL,
  p_limit integer DEFAULT 25
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_location_id uuid;
  v_actor_id uuid;
  v_is_admin boolean;
  v_limit integer;
  v_cursor_ts timestamptz;
  v_cursor_id text;
  v_items jsonb;
  v_has_more boolean;
  v_last_ts timestamptz;
  v_last_id text;
BEGIN
  v_location_id := private.require_active_staff();
  v_actor_id := auth.uid();
  v_is_admin := private.is_admin();
  v_limit := least(greatest(coalesce(p_limit, 25), 1), 100);

  IF p_cursor IS NOT NULL AND btrim(p_cursor) <> '' THEN
    SELECT d.cursor_ts, d.cursor_id
    INTO v_cursor_ts, v_cursor_id
    FROM private.decode_report_cursor(p_cursor) d;
  END IF;

  WITH filtered AS (
    SELECT
      ss.id,
      ss.profile_id,
      ss.status::text AS status,
      ss.opened_at,
      ss.closed_at,
      ss.opening_float_centavos,
      ss.expected_cash_centavos,
      ss.declared_cash_centavos,
      ss.variance_centavos,
      ss.notes
    FROM public.staff_shifts ss
    WHERE ss.parking_location_id = v_location_id
      AND (v_is_admin OR ss.profile_id = v_actor_id)
      AND (
        v_cursor_ts IS NULL
        OR (ss.opened_at, ss.id::text) < (v_cursor_ts, v_cursor_id)
      )
    ORDER BY ss.opened_at DESC, ss.id DESC
    LIMIT v_limit + 1
  ),
  page AS (
    SELECT *
    FROM filtered
    LIMIT v_limit
  )
  SELECT
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'shift_id', page.id,
          'profile_id', page.profile_id,
          'status', page.status,
          'opened_at', page.opened_at,
          'closed_at', page.closed_at,
          'opening_float_centavos', page.opening_float_centavos::text,
          'expected_cash_centavos', coalesce(page.expected_cash_centavos::text, '0'),
          'declared_cash_centavos', coalesce(page.declared_cash_centavos::text, '0'),
          'variance_centavos', coalesce(page.variance_centavos::text, '0'),
          'notes', page.notes
        )
        ORDER BY page.opened_at DESC, page.id DESC
      ),
      '[]'::jsonb
    ),
    (SELECT count(*) FROM filtered) > v_limit,
    (SELECT page.opened_at FROM page ORDER BY page.opened_at ASC, page.id ASC LIMIT 1),
    (SELECT page.id::text FROM page ORDER BY page.opened_at ASC, page.id ASC LIMIT 1)
  INTO v_items, v_has_more, v_last_ts, v_last_id
  FROM page;

  RETURN jsonb_build_object(
    'items', v_items,
    'pagination', jsonb_build_object(
      'limit', v_limit,
      'next_cursor', CASE
        WHEN v_has_more IS TRUE AND v_last_ts IS NOT NULL THEN private.encode_report_cursor(v_last_ts, v_last_id)
        ELSE NULL
      END
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION private.validate_report_date_range(date, date, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.redact_audit_jsonb(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.decode_report_cursor(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.encode_report_cursor(timestamptz, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.location_net_revenue_centavos(uuid, timestamptz, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.report_bounds(date, date, text) FROM PUBLIC;

REVOKE ALL ON FUNCTION public.list_transactions(date, date, text, text, text, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_report_preview(text, date, date) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.export_report(text, date, date, uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.search_audit_logs(timestamptz, timestamptz, text, uuid, uuid, text, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_shift_history(text, integer) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.list_transactions(date, date, text, text, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_report_preview(text, date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.export_report(text, date, date, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_audit_logs(timestamptz, timestamptz, text, uuid, uuid, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_shift_history(text, integer) TO authenticated;
