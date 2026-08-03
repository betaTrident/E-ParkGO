-- Phase 9: dashboard snapshot RPC, aggregate versions, private Broadcast invalidation.

CREATE TABLE private.dashboard_aggregate_versions (
  parking_location_id uuid PRIMARY KEY
    REFERENCES public.parking_locations (id) ON DELETE CASCADE,
  version bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT dashboard_aggregate_versions_version_nonnegative CHECK (version >= 0)
);

REVOKE ALL ON TABLE private.dashboard_aggregate_versions FROM PUBLIC;

CREATE OR REPLACE FUNCTION private.bump_dashboard_aggregate_version(p_location_id uuid)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_version bigint;
BEGIN
  INSERT INTO private.dashboard_aggregate_versions AS dav (parking_location_id, version)
  VALUES (p_location_id, 1)
  ON CONFLICT (parking_location_id) DO UPDATE
  SET
    version = dav.version + 1,
    updated_at = now()
  RETURNING version INTO v_version;

  RETURN v_version;
END;
$$;

REVOKE ALL ON FUNCTION private.bump_dashboard_aggregate_version(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.bump_dashboard_aggregate_version(uuid) TO postgres, service_role;

CREATE OR REPLACE FUNCTION private.broadcast_dashboard_invalidation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_location_id uuid;
  v_domain text;
  v_version bigint;
  v_topic text;
BEGIN
  IF TG_TABLE_SCHEMA <> 'public' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_TABLE_NAME = 'parking_spaces' THEN
    v_location_id := COALESCE(NEW.parking_location_id, OLD.parking_location_id);
    v_domain := 'spaces';
  ELSIF TG_TABLE_NAME = 'parking_sessions' THEN
    v_location_id := COALESCE(NEW.parking_location_id, OLD.parking_location_id);
    v_domain := 'sessions';
  ELSIF TG_TABLE_NAME = 'payments' THEN
    v_location_id := COALESCE(NEW.parking_location_id, OLD.parking_location_id);
    v_domain := 'payments';
  ELSE
    RETURN COALESCE(NEW, OLD);
  END IF;

  v_version := private.bump_dashboard_aggregate_version(v_location_id);
  v_topic := 'location:' || v_location_id::text || ':dashboard';

  PERFORM realtime.send(
    jsonb_build_object('domain', v_domain, 'aggregate_version', v_version),
    'dashboard_invalidate',
    v_topic,
    true
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

REVOKE ALL ON FUNCTION private.broadcast_dashboard_invalidation() FROM PUBLIC;

DROP TRIGGER IF EXISTS dashboard_broadcast_parking_spaces ON public.parking_spaces;
CREATE TRIGGER dashboard_broadcast_parking_spaces
  AFTER INSERT OR UPDATE OR DELETE ON public.parking_spaces
  FOR EACH ROW
  EXECUTE FUNCTION private.broadcast_dashboard_invalidation();

DROP TRIGGER IF EXISTS dashboard_broadcast_parking_sessions ON public.parking_sessions;
CREATE TRIGGER dashboard_broadcast_parking_sessions
  AFTER INSERT OR UPDATE OR DELETE ON public.parking_sessions
  FOR EACH ROW
  EXECUTE FUNCTION private.broadcast_dashboard_invalidation();

DROP TRIGGER IF EXISTS dashboard_broadcast_payments ON public.payments;
CREATE TRIGGER dashboard_broadcast_payments
  AFTER INSERT OR UPDATE OR DELETE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION private.broadcast_dashboard_invalidation();

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

  SELECT pl.timezone
  INTO v_timezone
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
    count(*)::integer,
    count(*) FILTER (WHERE ps.status = 'AVAILABLE'::public.space_status)::integer,
    count(*) FILTER (WHERE ps.status = 'OCCUPIED'::public.space_status)::integer,
    count(*) FILTER (WHERE ps.status = 'OUT_OF_SERVICE'::public.space_status)::integer
  INTO v_total_capacity, v_available, v_occupied, v_out_of_service
  FROM public.parking_spaces ps
  WHERE ps.parking_location_id = v_location_id
    AND ps.is_active = true;

  v_operational_capacity := GREATEST(v_total_capacity - v_out_of_service, 0);
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
        ps.code AS space_code,
        z.code AS zone_code,
        s.status::text AS session_status
      FROM public.parking_sessions s
      JOIN public.vehicles v
        ON v.id = s.vehicle_id AND v.parking_location_id = s.parking_location_id
      JOIN public.parking_spaces ps
        ON ps.id = s.parking_space_id AND ps.parking_location_id = s.parking_location_id
      JOIN public.parking_zones z
        ON z.id = ps.zone_id AND z.parking_location_id = s.parking_location_id
      WHERE s.parking_location_id = v_location_id
        AND (s.entry_time AT TIME ZONE v_timezone)::date = v_business_date
      UNION ALL
      SELECT
        'exit'::text,
        s.exit_time,
        s.id,
        v.display_plate_number,
        ps.code,
        z.code,
        s.status::text
      FROM public.parking_sessions s
      JOIN public.vehicles v
        ON v.id = s.vehicle_id AND v.parking_location_id = s.parking_location_id
      JOIN public.parking_spaces ps
        ON ps.id = s.parking_space_id AND ps.parking_location_id = s.parking_location_id
      JOIN public.parking_zones z
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

DROP POLICY IF EXISTS dashboard_location_broadcast_read ON realtime.messages;
CREATE POLICY dashboard_location_broadcast_read
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    topic LIKE 'location:%:dashboard'
    AND split_part(topic, ':', 2)::uuid = private.current_location_id()
    AND private.is_active_user()
  );
