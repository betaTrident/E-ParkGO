-- Phase 5: facility, zone, vehicle type, space, and rate configuration RPCs with audit and immutability.

CREATE OR REPLACE FUNCTION private.write_configuration_audit(
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

CREATE OR REPLACE FUNCTION private.validate_rate_draft_fields(
  p_mode public.rate_mode,
  p_grace_minutes integer,
  p_initial_minutes integer,
  p_initial_fee_centavos bigint,
  p_succeeding_interval_minutes integer,
  p_succeeding_fee_centavos bigint,
  p_flat_fee_centavos bigint,
  p_daily_max_centavos bigint,
  p_overnight_fee_centavos bigint,
  p_lost_ticket_penalty_centavos bigint,
  p_effective_from timestamptz,
  p_effective_to timestamptz
)
RETURNS void
LANGUAGE plpgsql
IMMUTABLE
SET search_path = ''
AS $$
BEGIN
  IF p_grace_minutes < 0 THEN
    RAISE EXCEPTION 'fee amounts must be nonnegative' USING ERRCODE = '22023';
  END IF;

  IF p_overnight_fee_centavos < 0
     OR p_lost_ticket_penalty_centavos < 0
     OR (p_daily_max_centavos IS NOT NULL AND p_daily_max_centavos < 0) THEN
    RAISE EXCEPTION 'fee amounts must be nonnegative' USING ERRCODE = '22023';
  END IF;

  IF p_effective_to IS NOT NULL AND p_effective_to <= p_effective_from THEN
    RAISE EXCEPTION 'effective_to must be after effective_from' USING ERRCODE = '22023';
  END IF;

  IF p_mode = 'FLAT'::public.rate_mode THEN
    IF p_flat_fee_centavos IS NULL OR p_flat_fee_centavos < 0 THEN
      RAISE EXCEPTION 'fee amounts must be nonnegative' USING ERRCODE = '22023';
    END IF;
    RETURN;
  END IF;

  IF p_mode = 'TIERED'::public.rate_mode THEN
    IF p_initial_minutes IS NULL
       OR p_initial_fee_centavos IS NULL
       OR p_succeeding_interval_minutes IS NULL
       OR p_succeeding_fee_centavos IS NULL
       OR p_initial_minutes <= 0
       OR p_succeeding_interval_minutes <= 0
       OR p_initial_fee_centavos < 0
       OR p_succeeding_fee_centavos < 0 THEN
      RAISE EXCEPTION 'tiered rate requires initial and succeeding fields' USING ERRCODE = '22023';
    END IF;
    RETURN;
  END IF;

  RAISE EXCEPTION 'invalid rate mode' USING ERRCODE = '22023';
END;
$$;

CREATE OR REPLACE FUNCTION public.prevent_published_rate_mutation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.is_published THEN
      RAISE EXCEPTION 'published rate rows cannot be deleted' USING ERRCODE = '42501';
    END IF;
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.is_published THEN
    IF NEW.is_published IS DISTINCT FROM OLD.is_published
       OR NEW.parking_location_id IS DISTINCT FROM OLD.parking_location_id
       OR NEW.vehicle_type_id IS DISTINCT FROM OLD.vehicle_type_id
       OR NEW.version IS DISTINCT FROM OLD.version
       OR NEW.mode IS DISTINCT FROM OLD.mode
       OR NEW.grace_minutes IS DISTINCT FROM OLD.grace_minutes
       OR NEW.initial_minutes IS DISTINCT FROM OLD.initial_minutes
       OR NEW.initial_fee_centavos IS DISTINCT FROM OLD.initial_fee_centavos
       OR NEW.succeeding_interval_minutes IS DISTINCT FROM OLD.succeeding_interval_minutes
       OR NEW.succeeding_fee_centavos IS DISTINCT FROM OLD.succeeding_fee_centavos
       OR NEW.flat_fee_centavos IS DISTINCT FROM OLD.flat_fee_centavos
       OR NEW.daily_max_centavos IS DISTINCT FROM OLD.daily_max_centavos
       OR NEW.overnight_fee_centavos IS DISTINCT FROM OLD.overnight_fee_centavos
       OR NEW.lost_ticket_penalty_centavos IS DISTINCT FROM OLD.lost_ticket_penalty_centavos
       OR NEW.effective_from IS DISTINCT FROM OLD.effective_from
       OR NEW.created_by IS DISTINCT FROM OLD.created_by
       OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
      RAISE EXCEPTION 'published rate rows are immutable' USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_published_rate_mutation
  BEFORE UPDATE OR DELETE ON public.parking_rates
  FOR EACH ROW EXECUTE FUNCTION public.prevent_published_rate_mutation();

CREATE OR REPLACE FUNCTION public.admin_update_facility_settings(
  p_name text,
  p_timezone text,
  p_receipt_prefix text,
  p_settings jsonb,
  p_correlation_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_location_id uuid;
  v_actor_id uuid;
  v_name text;
  v_timezone text;
  v_receipt_prefix text;
  v_before jsonb;
BEGIN
  v_location_id := private.require_active_admin();
  v_actor_id := auth.uid();
  v_name := btrim(p_name);
  v_timezone := btrim(p_timezone);
  v_receipt_prefix := btrim(p_receipt_prefix);

  IF v_name = '' THEN
    RAISE EXCEPTION 'facility name is required' USING ERRCODE = '22023';
  END IF;

  IF v_timezone = '' THEN
    RAISE EXCEPTION 'facility timezone is required' USING ERRCODE = '22023';
  END IF;

  IF v_receipt_prefix = '' THEN
    RAISE EXCEPTION 'facility receipt prefix is required' USING ERRCODE = '22023';
  END IF;

  SELECT jsonb_build_object(
    'name', pl.name,
    'timezone', pl.timezone,
    'receipt_prefix', pl.receipt_prefix,
    'settings', pl.settings
  )
  INTO v_before
  FROM public.parking_locations pl
  WHERE pl.id = v_location_id;

  UPDATE public.parking_locations pl
  SET
    name = v_name,
    timezone = v_timezone,
    receipt_prefix = v_receipt_prefix,
    settings = COALESCE(p_settings, '{}'::jsonb),
    updated_at = clock_timestamp()
  WHERE pl.id = v_location_id;

  PERFORM private.write_configuration_audit(
    v_location_id,
    v_actor_id,
    'facility.settings.update',
    'parking_location',
    v_location_id,
    'success',
    NULL,
    p_correlation_id,
    v_before,
    jsonb_build_object(
      'name', v_name,
      'timezone', v_timezone,
      'receipt_prefix', v_receipt_prefix,
      'settings', COALESCE(p_settings, '{}'::jsonb)
    )
  );

  RETURN v_location_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_create_parking_zone(
  p_code text,
  p_name text,
  p_sort_order integer,
  p_correlation_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_location_id uuid;
  v_actor_id uuid;
  v_code text;
  v_name text;
  v_zone_id uuid;
BEGIN
  v_location_id := private.require_active_admin();
  v_actor_id := auth.uid();
  v_code := btrim(p_code);
  v_name := btrim(p_name);

  IF v_code = '' THEN
    RAISE EXCEPTION 'zone code is required' USING ERRCODE = '22023';
  END IF;

  IF v_name = '' THEN
    RAISE EXCEPTION 'zone name is required' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.parking_zones (
    parking_location_id,
    code,
    name,
    sort_order,
    is_active
  )
  VALUES (
    v_location_id,
    v_code,
    v_name,
    COALESCE(p_sort_order, 0),
    true
  )
  RETURNING id INTO v_zone_id;

  PERFORM private.write_configuration_audit(
    v_location_id,
    v_actor_id,
    'zone.create',
    'parking_zone',
    v_zone_id,
    'success',
    NULL,
    p_correlation_id,
    NULL,
    jsonb_build_object(
      'code', v_code,
      'name', v_name,
      'sort_order', COALESCE(p_sort_order, 0)
    )
  );

  RETURN v_zone_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_parking_zone(
  p_zone_id uuid,
  p_name text,
  p_sort_order integer,
  p_correlation_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_location_id uuid;
  v_actor_id uuid;
  v_name text;
  v_before jsonb;
BEGIN
  v_location_id := private.require_active_admin();
  v_actor_id := auth.uid();
  v_name := btrim(p_name);

  IF v_name = '' THEN
    RAISE EXCEPTION 'zone name is required' USING ERRCODE = '22023';
  END IF;

  SELECT jsonb_build_object(
    'name', pz.name,
    'sort_order', pz.sort_order
  )
  INTO v_before
  FROM public.parking_zones pz
  WHERE pz.id = p_zone_id
    AND pz.parking_location_id = v_location_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'zone not found in admin location' USING ERRCODE = '42501';
  END IF;

  UPDATE public.parking_zones pz
  SET
    name = v_name,
    sort_order = COALESCE(p_sort_order, pz.sort_order),
    updated_at = clock_timestamp()
  WHERE pz.id = p_zone_id
    AND pz.parking_location_id = v_location_id;

  PERFORM private.write_configuration_audit(
    v_location_id,
    v_actor_id,
    'zone.update',
    'parking_zone',
    p_zone_id,
    'success',
    NULL,
    p_correlation_id,
    v_before,
    jsonb_build_object(
      'name', v_name,
      'sort_order', COALESCE(p_sort_order, (v_before->>'sort_order')::integer)
    )
  );

  RETURN p_zone_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_deactivate_parking_zone(
  p_zone_id uuid,
  p_correlation_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_location_id uuid;
  v_actor_id uuid;
  v_is_active boolean;
BEGIN
  v_location_id := private.require_active_admin();
  v_actor_id := auth.uid();

  SELECT pz.is_active
  INTO v_is_active
  FROM public.parking_zones pz
  WHERE pz.id = p_zone_id
    AND pz.parking_location_id = v_location_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'zone not found in admin location' USING ERRCODE = '42501';
  END IF;

  IF NOT v_is_active THEN
    RAISE EXCEPTION 'zone is already inactive' USING ERRCODE = '22023';
  END IF;

  UPDATE public.parking_zones pz
  SET
    is_active = false,
    updated_at = clock_timestamp()
  WHERE pz.id = p_zone_id
    AND pz.parking_location_id = v_location_id;

  PERFORM private.write_configuration_audit(
    v_location_id,
    v_actor_id,
    'zone.deactivate',
    'parking_zone',
    p_zone_id,
    'success',
    NULL,
    p_correlation_id,
    jsonb_build_object('is_active', true),
    jsonb_build_object('is_active', false)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_create_vehicle_type(
  p_code text,
  p_name text,
  p_correlation_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_location_id uuid;
  v_actor_id uuid;
  v_code text;
  v_name text;
  v_vehicle_type_id uuid;
BEGIN
  v_location_id := private.require_active_admin();
  v_actor_id := auth.uid();
  v_code := btrim(p_code);
  v_name := btrim(p_name);

  IF v_code = '' THEN
    RAISE EXCEPTION 'vehicle type code is required' USING ERRCODE = '22023';
  END IF;

  IF v_name = '' THEN
    RAISE EXCEPTION 'vehicle type name is required' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.vehicle_types (
    parking_location_id,
    code,
    name,
    is_active
  )
  VALUES (
    v_location_id,
    v_code,
    v_name,
    true
  )
  RETURNING id INTO v_vehicle_type_id;

  PERFORM private.write_configuration_audit(
    v_location_id,
    v_actor_id,
    'vehicle_type.create',
    'vehicle_type',
    v_vehicle_type_id,
    'success',
    NULL,
    p_correlation_id,
    NULL,
    jsonb_build_object('code', v_code, 'name', v_name)
  );

  RETURN v_vehicle_type_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_vehicle_type(
  p_vehicle_type_id uuid,
  p_name text,
  p_correlation_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_location_id uuid;
  v_actor_id uuid;
  v_name text;
  v_before jsonb;
BEGIN
  v_location_id := private.require_active_admin();
  v_actor_id := auth.uid();
  v_name := btrim(p_name);

  IF v_name = '' THEN
    RAISE EXCEPTION 'vehicle type name is required' USING ERRCODE = '22023';
  END IF;

  SELECT jsonb_build_object('name', vt.name)
  INTO v_before
  FROM public.vehicle_types vt
  WHERE vt.id = p_vehicle_type_id
    AND vt.parking_location_id = v_location_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'vehicle type not found in admin location' USING ERRCODE = '42501';
  END IF;

  UPDATE public.vehicle_types vt
  SET
    name = v_name,
    updated_at = clock_timestamp()
  WHERE vt.id = p_vehicle_type_id
    AND vt.parking_location_id = v_location_id;

  PERFORM private.write_configuration_audit(
    v_location_id,
    v_actor_id,
    'vehicle_type.update',
    'vehicle_type',
    p_vehicle_type_id,
    'success',
    NULL,
    p_correlation_id,
    v_before,
    jsonb_build_object('name', v_name)
  );

  RETURN p_vehicle_type_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_deactivate_vehicle_type(
  p_vehicle_type_id uuid,
  p_correlation_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_location_id uuid;
  v_actor_id uuid;
  v_is_active boolean;
BEGIN
  v_location_id := private.require_active_admin();
  v_actor_id := auth.uid();

  SELECT vt.is_active
  INTO v_is_active
  FROM public.vehicle_types vt
  WHERE vt.id = p_vehicle_type_id
    AND vt.parking_location_id = v_location_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'vehicle type not found in admin location' USING ERRCODE = '42501';
  END IF;

  IF NOT v_is_active THEN
    RAISE EXCEPTION 'vehicle type is already inactive' USING ERRCODE = '22023';
  END IF;

  UPDATE public.vehicle_types vt
  SET
    is_active = false,
    updated_at = clock_timestamp()
  WHERE vt.id = p_vehicle_type_id
    AND vt.parking_location_id = v_location_id;

  PERFORM private.write_configuration_audit(
    v_location_id,
    v_actor_id,
    'vehicle_type.deactivate',
    'vehicle_type',
    p_vehicle_type_id,
    'success',
    NULL,
    p_correlation_id,
    jsonb_build_object('is_active', true),
    jsonb_build_object('is_active', false)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_create_parking_space(
  p_zone_id uuid,
  p_code text,
  p_vehicle_type_id uuid,
  p_correlation_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_location_id uuid;
  v_actor_id uuid;
  v_code text;
  v_space_id uuid;
BEGIN
  v_location_id := private.require_active_admin();
  v_actor_id := auth.uid();
  v_code := btrim(p_code);

  IF v_code = '' THEN
    RAISE EXCEPTION 'space code is required' USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.parking_zones pz
    WHERE pz.id = p_zone_id
      AND pz.parking_location_id = v_location_id
  ) THEN
    RAISE EXCEPTION 'zone not found in admin location' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.vehicle_types vt
    WHERE vt.id = p_vehicle_type_id
      AND vt.parking_location_id = v_location_id
  ) THEN
    RAISE EXCEPTION 'vehicle type not found in admin location' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.parking_spaces (
    parking_location_id,
    zone_id,
    code,
    vehicle_type_id,
    status,
    version,
    is_active
  )
  VALUES (
    v_location_id,
    p_zone_id,
    v_code,
    p_vehicle_type_id,
    'AVAILABLE'::public.space_status,
    1,
    true
  )
  RETURNING id INTO v_space_id;

  PERFORM private.write_configuration_audit(
    v_location_id,
    v_actor_id,
    'space.create',
    'parking_space',
    v_space_id,
    'success',
    NULL,
    p_correlation_id,
    NULL,
    jsonb_build_object(
      'zone_id', p_zone_id,
      'code', v_code,
      'vehicle_type_id', p_vehicle_type_id
    )
  );

  RETURN v_space_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_parking_space(
  p_space_id uuid,
  p_zone_id uuid,
  p_vehicle_type_id uuid,
  p_correlation_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_location_id uuid;
  v_actor_id uuid;
  v_before record;
  v_config_changed boolean;
BEGIN
  v_location_id := private.require_active_admin();
  v_actor_id := auth.uid();

  SELECT ps.zone_id, ps.vehicle_type_id, ps.version
  INTO v_before
  FROM public.parking_spaces ps
  WHERE ps.id = p_space_id
    AND ps.parking_location_id = v_location_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'space not found in admin location' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.parking_zones pz
    WHERE pz.id = p_zone_id
      AND pz.parking_location_id = v_location_id
  ) THEN
    RAISE EXCEPTION 'zone not found in admin location' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.vehicle_types vt
    WHERE vt.id = p_vehicle_type_id
      AND vt.parking_location_id = v_location_id
  ) THEN
    RAISE EXCEPTION 'vehicle type not found in admin location' USING ERRCODE = '42501';
  END IF;

  v_config_changed :=
    p_zone_id IS DISTINCT FROM v_before.zone_id
    OR p_vehicle_type_id IS DISTINCT FROM v_before.vehicle_type_id;

  UPDATE public.parking_spaces ps
  SET
    zone_id = p_zone_id,
    vehicle_type_id = p_vehicle_type_id,
    version = CASE
      WHEN v_config_changed THEN v_before.version + 1
      ELSE ps.version
    END,
    updated_at = clock_timestamp()
  WHERE ps.id = p_space_id
    AND ps.parking_location_id = v_location_id;

  PERFORM private.write_configuration_audit(
    v_location_id,
    v_actor_id,
    'space.update',
    'parking_space',
    p_space_id,
    'success',
    NULL,
    p_correlation_id,
    jsonb_build_object(
      'zone_id', v_before.zone_id,
      'vehicle_type_id', v_before.vehicle_type_id,
      'version', v_before.version
    ),
    jsonb_build_object(
      'zone_id', p_zone_id,
      'vehicle_type_id', p_vehicle_type_id,
      'version', CASE
        WHEN v_config_changed THEN v_before.version + 1
        ELSE v_before.version
      END
    )
  );

  RETURN p_space_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_deactivate_parking_space(
  p_space_id uuid,
  p_correlation_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_location_id uuid;
  v_actor_id uuid;
  v_space record;
BEGIN
  v_location_id := private.require_active_admin();
  v_actor_id := auth.uid();

  SELECT ps.status, ps.is_active
  INTO v_space
  FROM public.parking_spaces ps
  WHERE ps.id = p_space_id
    AND ps.parking_location_id = v_location_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'space not found in admin location' USING ERRCODE = '42501';
  END IF;

  IF v_space.status = 'OCCUPIED'::public.space_status THEN
    RAISE EXCEPTION 'occupied spaces cannot be deactivated' USING ERRCODE = '22023';
  END IF;

  IF NOT v_space.is_active THEN
    RAISE EXCEPTION 'space is already inactive' USING ERRCODE = '22023';
  END IF;

  UPDATE public.parking_spaces ps
  SET
    is_active = false,
    updated_at = clock_timestamp()
  WHERE ps.id = p_space_id
    AND ps.parking_location_id = v_location_id;

  PERFORM private.write_configuration_audit(
    v_location_id,
    v_actor_id,
    'space.deactivate',
    'parking_space',
    p_space_id,
    'success',
    NULL,
    p_correlation_id,
    jsonb_build_object('is_active', true),
    jsonb_build_object('is_active', false)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_parking_space_status(
  p_space_id uuid,
  p_status public.space_status,
  p_expected_version bigint,
  p_correlation_id uuid
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_location_id uuid;
  v_actor_id uuid;
  v_before record;
  v_new_version bigint;
BEGIN
  v_location_id := private.require_active_admin();
  v_actor_id := auth.uid();

  IF p_status = 'OCCUPIED'::public.space_status THEN
    RAISE EXCEPTION 'occupied status cannot be set manually' USING ERRCODE = '22023';
  END IF;

  IF p_status NOT IN (
    'AVAILABLE'::public.space_status,
    'OUT_OF_SERVICE'::public.space_status
  ) THEN
    RAISE EXCEPTION 'invalid space status for manual update' USING ERRCODE = '22023';
  END IF;

  SELECT ps.status, ps.version
  INTO v_before
  FROM public.parking_spaces ps
  WHERE ps.id = p_space_id
    AND ps.parking_location_id = v_location_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'space not found in admin location' USING ERRCODE = '42501';
  END IF;

  IF v_before.version <> p_expected_version THEN
    RAISE EXCEPTION 'space version conflict' USING ERRCODE = '22023';
  END IF;

  v_new_version := v_before.version + 1;

  UPDATE public.parking_spaces ps
  SET
    status = p_status,
    version = v_new_version,
    updated_at = clock_timestamp()
  WHERE ps.id = p_space_id
    AND ps.parking_location_id = v_location_id
    AND ps.version = p_expected_version;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'space version conflict' USING ERRCODE = '22023';
  END IF;

  PERFORM private.write_configuration_audit(
    v_location_id,
    v_actor_id,
    'space.status.update',
    'parking_space',
    p_space_id,
    'success',
    NULL,
    p_correlation_id,
    jsonb_build_object('status', v_before.status, 'version', v_before.version),
    jsonb_build_object('status', p_status, 'version', v_new_version)
  );

  RETURN v_new_version;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_create_rate_draft(
  p_vehicle_type_id uuid,
  p_mode public.rate_mode,
  p_grace_minutes integer,
  p_initial_minutes integer,
  p_initial_fee_centavos bigint,
  p_succeeding_interval_minutes integer,
  p_succeeding_fee_centavos bigint,
  p_flat_fee_centavos bigint,
  p_daily_max_centavos bigint,
  p_overnight_fee_centavos bigint,
  p_lost_ticket_penalty_centavos bigint,
  p_effective_from timestamptz,
  p_effective_to timestamptz,
  p_correlation_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_location_id uuid;
  v_actor_id uuid;
  v_rate_id uuid;
  v_version integer;
BEGIN
  v_location_id := private.require_active_admin();
  v_actor_id := auth.uid();

  IF NOT EXISTS (
    SELECT 1
    FROM public.vehicle_types vt
    WHERE vt.id = p_vehicle_type_id
      AND vt.parking_location_id = v_location_id
  ) THEN
    RAISE EXCEPTION 'vehicle type not found in admin location' USING ERRCODE = '42501';
  END IF;

  PERFORM private.validate_rate_draft_fields(
    p_mode,
    p_grace_minutes,
    p_initial_minutes,
    p_initial_fee_centavos,
    p_succeeding_interval_minutes,
    p_succeeding_fee_centavos,
    p_flat_fee_centavos,
    p_daily_max_centavos,
    p_overnight_fee_centavos,
    p_lost_ticket_penalty_centavos,
    p_effective_from,
    p_effective_to
  );

  SELECT COALESCE(MAX(pr.version), 0) + 1
  INTO v_version
  FROM public.parking_rates pr
  WHERE pr.parking_location_id = v_location_id
    AND pr.vehicle_type_id IS NOT DISTINCT FROM p_vehicle_type_id;

  INSERT INTO public.parking_rates (
    parking_location_id,
    vehicle_type_id,
    version,
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
    effective_from,
    effective_to,
    is_published,
    created_by
  )
  VALUES (
    v_location_id,
    p_vehicle_type_id,
    v_version,
    p_mode,
    p_grace_minutes,
    p_initial_minutes,
    p_initial_fee_centavos,
    p_succeeding_interval_minutes,
    p_succeeding_fee_centavos,
    p_flat_fee_centavos,
    p_daily_max_centavos,
    p_overnight_fee_centavos,
    p_lost_ticket_penalty_centavos,
    p_effective_from,
    p_effective_to,
    false,
    v_actor_id
  )
  RETURNING id INTO v_rate_id;

  PERFORM private.write_configuration_audit(
    v_location_id,
    v_actor_id,
    'rate.draft.create',
    'parking_rate',
    v_rate_id,
    'success',
    NULL,
    p_correlation_id,
    NULL,
    jsonb_build_object(
      'vehicle_type_id', p_vehicle_type_id,
      'version', v_version,
      'mode', p_mode,
      'effective_from', p_effective_from,
      'effective_to', p_effective_to
    )
  );

  RETURN v_rate_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_rate_draft(
  p_rate_id uuid,
  p_vehicle_type_id uuid,
  p_mode public.rate_mode,
  p_grace_minutes integer,
  p_initial_minutes integer,
  p_initial_fee_centavos bigint,
  p_succeeding_interval_minutes integer,
  p_succeeding_fee_centavos bigint,
  p_flat_fee_centavos bigint,
  p_daily_max_centavos bigint,
  p_overnight_fee_centavos bigint,
  p_lost_ticket_penalty_centavos bigint,
  p_effective_from timestamptz,
  p_effective_to timestamptz,
  p_correlation_id uuid
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
BEGIN
  v_location_id := private.require_active_admin();
  v_actor_id := auth.uid();

  SELECT jsonb_build_object(
    'vehicle_type_id', pr.vehicle_type_id,
    'mode', pr.mode,
    'grace_minutes', pr.grace_minutes,
    'effective_from', pr.effective_from,
    'effective_to', pr.effective_to
  )
  INTO v_before
  FROM public.parking_rates pr
  WHERE pr.id = p_rate_id
    AND pr.parking_location_id = v_location_id
    AND pr.is_published = false;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'only unpublished rate drafts may be updated' USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.vehicle_types vt
    WHERE vt.id = p_vehicle_type_id
      AND vt.parking_location_id = v_location_id
  ) THEN
    RAISE EXCEPTION 'vehicle type not found in admin location' USING ERRCODE = '42501';
  END IF;

  PERFORM private.validate_rate_draft_fields(
    p_mode,
    p_grace_minutes,
    p_initial_minutes,
    p_initial_fee_centavos,
    p_succeeding_interval_minutes,
    p_succeeding_fee_centavos,
    p_flat_fee_centavos,
    p_daily_max_centavos,
    p_overnight_fee_centavos,
    p_lost_ticket_penalty_centavos,
    p_effective_from,
    p_effective_to
  );

  UPDATE public.parking_rates pr
  SET
    vehicle_type_id = p_vehicle_type_id,
    mode = p_mode,
    grace_minutes = p_grace_minutes,
    initial_minutes = p_initial_minutes,
    initial_fee_centavos = p_initial_fee_centavos,
    succeeding_interval_minutes = p_succeeding_interval_minutes,
    succeeding_fee_centavos = p_succeeding_fee_centavos,
    flat_fee_centavos = p_flat_fee_centavos,
    daily_max_centavos = p_daily_max_centavos,
    overnight_fee_centavos = p_overnight_fee_centavos,
    lost_ticket_penalty_centavos = p_lost_ticket_penalty_centavos,
    effective_from = p_effective_from,
    effective_to = p_effective_to,
    updated_at = clock_timestamp()
  WHERE pr.id = p_rate_id
    AND pr.parking_location_id = v_location_id
    AND pr.is_published = false;

  PERFORM private.write_configuration_audit(
    v_location_id,
    v_actor_id,
    'rate.draft.update',
    'parking_rate',
    p_rate_id,
    'success',
    NULL,
    p_correlation_id,
    v_before,
    jsonb_build_object(
      'vehicle_type_id', p_vehicle_type_id,
      'mode', p_mode,
      'grace_minutes', p_grace_minutes,
      'effective_from', p_effective_from,
      'effective_to', p_effective_to
    )
  );

  RETURN p_rate_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_publish_rate(
  p_rate_id uuid,
  p_correlation_id uuid
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
BEGIN
  v_location_id := private.require_active_admin();
  v_actor_id := auth.uid();

  SELECT jsonb_build_object(
    'is_published', pr.is_published,
    'version', pr.version,
    'effective_from', pr.effective_from,
    'effective_to', pr.effective_to
  )
  INTO v_before
  FROM public.parking_rates pr
  WHERE pr.id = p_rate_id
    AND pr.parking_location_id = v_location_id
    AND pr.is_published = false;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'only unpublished rate drafts may be published' USING ERRCODE = '22023';
  END IF;

  UPDATE public.parking_rates pr
  SET
    is_published = true,
    updated_at = clock_timestamp()
  WHERE pr.id = p_rate_id
    AND pr.parking_location_id = v_location_id
    AND pr.is_published = false;

  PERFORM private.write_configuration_audit(
    v_location_id,
    v_actor_id,
    'rate.publish',
    'parking_rate',
    p_rate_id,
    'success',
    NULL,
    p_correlation_id,
    v_before,
    jsonb_build_object('is_published', true)
  );

  RETURN p_rate_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_retire_published_rate(
  p_rate_id uuid,
  p_effective_to timestamptz,
  p_correlation_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_location_id uuid;
  v_actor_id uuid;
  v_rate record;
BEGIN
  v_location_id := private.require_active_admin();
  v_actor_id := auth.uid();

  SELECT pr.effective_from, pr.effective_to, pr.is_published
  INTO v_rate
  FROM public.parking_rates pr
  WHERE pr.id = p_rate_id
    AND pr.parking_location_id = v_location_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'rate not found in admin location' USING ERRCODE = '42501';
  END IF;

  IF NOT v_rate.is_published THEN
    RAISE EXCEPTION 'only published rates may be retired' USING ERRCODE = '22023';
  END IF;

  IF p_effective_to IS NULL OR p_effective_to <= v_rate.effective_from THEN
    RAISE EXCEPTION 'retirement effective_to must be after effective_from' USING ERRCODE = '22023';
  END IF;

  IF v_rate.effective_to IS NOT NULL THEN
    RAISE EXCEPTION 'rate is already retired' USING ERRCODE = '22023';
  END IF;

  UPDATE public.parking_rates pr
  SET
    effective_to = p_effective_to,
    updated_at = clock_timestamp()
  WHERE pr.id = p_rate_id
    AND pr.parking_location_id = v_location_id
    AND pr.is_published = true;

  PERFORM private.write_configuration_audit(
    v_location_id,
    v_actor_id,
    'rate.retire',
    'parking_rate',
    p_rate_id,
    'success',
    NULL,
    p_correlation_id,
    jsonb_build_object('effective_to', v_rate.effective_to),
    jsonb_build_object('effective_to', p_effective_to)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_withdraw_rate_draft(
  p_rate_id uuid,
  p_correlation_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_location_id uuid;
  v_actor_id uuid;
  v_before jsonb;
BEGIN
  v_location_id := private.require_active_admin();
  v_actor_id := auth.uid();

  SELECT jsonb_build_object(
    'vehicle_type_id', pr.vehicle_type_id,
    'version', pr.version,
    'mode', pr.mode
  )
  INTO v_before
  FROM public.parking_rates pr
  WHERE pr.id = p_rate_id
    AND pr.parking_location_id = v_location_id
    AND pr.is_published = false;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'only unpublished rate drafts may be withdrawn' USING ERRCODE = '22023';
  END IF;

  DELETE FROM public.parking_rates pr
  WHERE pr.id = p_rate_id
    AND pr.parking_location_id = v_location_id
    AND pr.is_published = false;

  PERFORM private.write_configuration_audit(
    v_location_id,
    v_actor_id,
    'rate.draft.withdraw',
    'parking_rate',
    p_rate_id,
    'success',
    NULL,
    p_correlation_id,
    v_before,
    NULL
  );
END;
$$;

REVOKE ALL ON FUNCTION private.write_configuration_audit(uuid, uuid, text, text, uuid, text, text, uuid, jsonb, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.validate_rate_draft_fields(public.rate_mode, integer, integer, bigint, integer, bigint, bigint, bigint, bigint, bigint, timestamptz, timestamptz) FROM PUBLIC;

REVOKE ALL ON FUNCTION public.prevent_published_rate_mutation() FROM PUBLIC;

REVOKE ALL ON FUNCTION public.admin_update_facility_settings(text, text, text, jsonb, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_create_parking_zone(text, text, integer, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_update_parking_zone(uuid, text, integer, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_deactivate_parking_zone(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_create_vehicle_type(text, text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_update_vehicle_type(uuid, text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_deactivate_vehicle_type(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_create_parking_space(uuid, text, uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_update_parking_space(uuid, uuid, uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_deactivate_parking_space(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_set_parking_space_status(uuid, public.space_status, bigint, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_create_rate_draft(uuid, public.rate_mode, integer, integer, bigint, integer, bigint, bigint, bigint, bigint, bigint, timestamptz, timestamptz, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_update_rate_draft(uuid, uuid, public.rate_mode, integer, integer, bigint, integer, bigint, bigint, bigint, bigint, bigint, timestamptz, timestamptz, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_publish_rate(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_retire_published_rate(uuid, timestamptz, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_withdraw_rate_draft(uuid, uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.admin_update_facility_settings(text, text, text, jsonb, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_parking_zone(text, text, integer, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_parking_zone(uuid, text, integer, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_deactivate_parking_zone(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_vehicle_type(text, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_vehicle_type(uuid, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_deactivate_vehicle_type(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_parking_space(uuid, text, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_parking_space(uuid, uuid, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_deactivate_parking_space(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_parking_space_status(uuid, public.space_status, bigint, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_rate_draft(uuid, public.rate_mode, integer, integer, bigint, integer, bigint, bigint, bigint, bigint, bigint, timestamptz, timestamptz, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_rate_draft(uuid, uuid, public.rate_mode, integer, integer, bigint, integer, bigint, bigint, bigint, bigint, bigint, timestamptz, timestamptz, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_publish_rate(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_retire_published_rate(uuid, timestamptz, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_withdraw_rate_draft(uuid, uuid) TO authenticated;
