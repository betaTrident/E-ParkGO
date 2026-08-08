-- Catch-up migration: remote/local environments missing Phase 4/5 configuration RPCs.
-- Re-applies require_active_admin, write_configuration_audit, facility/zone/vehicle/space
-- admin RPCs, and admin_update_location_capacities. Patches admin_create_vehicle_type to
-- set capacity_pool (MOTO -> MOTORCYCLE, else CAR). Idempotent CREATE OR REPLACE only.

CREATE OR REPLACE FUNCTION private.require_active_admin()
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

  IF NOT private.is_active_user() OR NOT private.is_admin() THEN
    RAISE EXCEPTION 'admin authorization required' USING ERRCODE = '42501';
  END IF;

  v_location_id := private.current_location_id();

  IF v_location_id IS NULL THEN
    RAISE EXCEPTION 'admin location context missing' USING ERRCODE = '42501';
  END IF;

  RETURN v_location_id;
END;
$$;

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
  v_capacity_pool text;
  v_vehicle_type_id uuid;
BEGIN
  v_location_id := private.require_active_admin();
  v_actor_id := auth.uid();
  v_code := btrim(p_code);
  v_name := btrim(p_name);
  v_capacity_pool := CASE upper(v_code) WHEN 'MOTO' THEN 'MOTORCYCLE' ELSE 'CAR' END;

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
    capacity_pool,
    is_active
  )
  VALUES (
    v_location_id,
    v_code,
    v_name,
    v_capacity_pool,
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
    jsonb_build_object(
      'code', v_code,
      'name', v_name,
      'capacity_pool', v_capacity_pool
    )
  );

  RETURN v_vehicle_type_id;
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

REVOKE ALL ON FUNCTION private.require_active_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.write_configuration_audit(uuid, uuid, text, text, uuid, text, text, uuid, jsonb, jsonb) FROM PUBLIC;

REVOKE ALL ON FUNCTION public.admin_update_facility_settings(text, text, text, jsonb, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_create_parking_zone(text, text, integer, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_create_vehicle_type(text, text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_create_parking_space(uuid, text, uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_update_parking_space(uuid, uuid, uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_set_parking_space_status(uuid, public.space_status, bigint, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_update_location_capacities(integer, integer) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.admin_update_facility_settings(text, text, text, jsonb, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_parking_zone(text, text, integer, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_vehicle_type(text, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_parking_space(uuid, text, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_parking_space(uuid, uuid, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_parking_space_status(uuid, public.space_status, bigint, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_location_capacities(integer, integer) TO authenticated, service_role;
