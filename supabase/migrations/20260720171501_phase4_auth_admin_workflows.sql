-- Phase 4: protected staff administration RPCs with audit and escalation guards.

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

CREATE OR REPLACE FUNCTION private.require_manageable_staff_target(p_target_id uuid)
RETURNS TABLE (
  target_id uuid,
  parking_location_id uuid,
  role public.app_role,
  is_active boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_location_id uuid;
  v_target record;
BEGIN
  v_location_id := private.require_active_admin();

  SELECT p.id, p.parking_location_id, p.role, p.is_active
  INTO v_target
  FROM public.profiles p
  WHERE p.id = p_target_id
    AND p.parking_location_id = v_location_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'staff target not found in admin location' USING ERRCODE = '42501';
  END IF;

  target_id := v_target.id;
  parking_location_id := v_target.parking_location_id;
  role := v_target.role;
  is_active := v_target.is_active;
  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION private.active_admin_count(
  p_location_id uuid,
  p_exclude uuid DEFAULT NULL
)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT count(*)::integer
  FROM public.profiles p
  WHERE p.parking_location_id = p_location_id
    AND p.role = 'ADMIN'::public.app_role
    AND p.is_active = true
    AND p.disabled_at IS NULL
    AND (p_exclude IS NULL OR p.id <> p_exclude);
$$;

CREATE OR REPLACE FUNCTION private.write_staff_audit(
  p_location_id uuid,
  p_actor_id uuid,
  p_action text,
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
    'profile',
    p_target_id,
    p_result,
    p_reason,
    p_correlation_id,
    p_before_data,
    p_after_data
  );
$$;

CREATE OR REPLACE FUNCTION public.admin_create_staff_profile(
  p_user_id uuid,
  p_full_name text,
  p_role public.app_role,
  p_can_approve_overrides boolean,
  p_can_void_payments boolean,
  p_can_process_lost_tickets boolean,
  p_can_correct_session_times boolean,
  p_can_cancel_sessions boolean,
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
  v_trimmed_name text;
BEGIN
  v_location_id := private.require_active_admin();
  v_actor_id := auth.uid();
  v_trimmed_name := btrim(p_full_name);

  IF v_trimmed_name = '' THEN
    RAISE EXCEPTION 'full name is required' USING ERRCODE = '22023';
  END IF;

  IF p_role NOT IN ('ADMIN'::public.app_role, 'STAFF'::public.app_role) THEN
    RAISE EXCEPTION 'invalid staff role' USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p_user_id) THEN
    RAISE EXCEPTION 'auth identity not found' USING ERRCODE = '23503';
  END IF;

  IF EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = p_user_id) THEN
    RAISE EXCEPTION 'profile already exists' USING ERRCODE = '23505';
  END IF;

  INSERT INTO public.profiles (
    id,
    parking_location_id,
    role,
    full_name,
    is_active,
    disabled_at
  )
  VALUES (
    p_user_id,
    v_location_id,
    p_role,
    v_trimmed_name,
    true,
    NULL
  );

  INSERT INTO public.staff_permissions (
    profile_id,
    can_approve_overrides,
    can_void_payments,
    can_process_lost_tickets,
    can_correct_session_times,
    can_cancel_sessions,
    updated_by
  )
  VALUES (
    p_user_id,
    p_can_approve_overrides,
    p_can_void_payments,
    p_can_process_lost_tickets,
    p_can_correct_session_times,
    p_can_cancel_sessions,
    v_actor_id
  );

  PERFORM private.write_staff_audit(
    v_location_id,
    v_actor_id,
    'staff.profile.create',
    p_user_id,
    'success',
    NULL,
    p_correlation_id,
    NULL,
    jsonb_build_object(
      'role', p_role,
      'full_name', v_trimmed_name,
      'permissions', jsonb_build_object(
        'can_approve_overrides', p_can_approve_overrides,
        'can_void_payments', p_can_void_payments,
        'can_process_lost_tickets', p_can_process_lost_tickets,
        'can_correct_session_times', p_can_correct_session_times,
        'can_cancel_sessions', p_can_cancel_sessions
      )
    )
  );

  RETURN p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_disable_staff(
  p_target_id uuid,
  p_reason text,
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
  v_target record;
  v_reason text;
BEGIN
  v_location_id := private.require_active_admin();
  v_actor_id := auth.uid();
  v_reason := NULLIF(btrim(p_reason), '');

  IF v_reason IS NULL THEN
    RAISE EXCEPTION 'disable reason is required' USING ERRCODE = '22023';
  END IF;

  IF p_target_id = v_actor_id THEN
    RAISE EXCEPTION 'cannot disable own account' USING ERRCODE = '42501';
  END IF;

  SELECT *
  INTO v_target
  FROM private.require_manageable_staff_target(p_target_id);

  IF v_target.role = 'ADMIN'::public.app_role
     AND private.active_admin_count(v_location_id, p_target_id) = 0 THEN
    RAISE EXCEPTION 'cannot disable last active admin' USING ERRCODE = '42501';
  END IF;

  IF NOT v_target.is_active THEN
    RAISE EXCEPTION 'staff account is already disabled' USING ERRCODE = '22023';
  END IF;

  UPDATE public.profiles p
  SET
    is_active = false,
    disabled_at = clock_timestamp(),
    updated_at = clock_timestamp()
  WHERE p.id = p_target_id;

  PERFORM private.write_staff_audit(
    v_location_id,
    v_actor_id,
    'staff.profile.disable',
    p_target_id,
    'success',
    v_reason,
    p_correlation_id,
    jsonb_build_object('is_active', true),
    jsonb_build_object('is_active', false)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_reactivate_staff(
  p_target_id uuid,
  p_reason text,
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
  v_target record;
  v_reason text;
BEGIN
  v_location_id := private.require_active_admin();
  v_actor_id := auth.uid();
  v_reason := NULLIF(btrim(p_reason), '');

  IF v_reason IS NULL THEN
    RAISE EXCEPTION 'reactivation reason is required' USING ERRCODE = '22023';
  END IF;

  SELECT *
  INTO v_target
  FROM private.require_manageable_staff_target(p_target_id);

  IF v_target.is_active THEN
    RAISE EXCEPTION 'staff account is already active' USING ERRCODE = '22023';
  END IF;

  UPDATE public.profiles p
  SET
    is_active = true,
    disabled_at = NULL,
    updated_at = clock_timestamp()
  WHERE p.id = p_target_id;

  PERFORM private.write_staff_audit(
    v_location_id,
    v_actor_id,
    'staff.profile.reactivate',
    p_target_id,
    'success',
    v_reason,
    p_correlation_id,
    jsonb_build_object('is_active', false),
    jsonb_build_object('is_active', true)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_staff_permissions(
  p_target_id uuid,
  p_can_approve_overrides boolean,
  p_can_void_payments boolean,
  p_can_process_lost_tickets boolean,
  p_can_correct_session_times boolean,
  p_can_cancel_sessions boolean,
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

  IF p_target_id = v_actor_id THEN
    RAISE EXCEPTION 'cannot modify own permissions' USING ERRCODE = '42501';
  END IF;

  PERFORM 1
  FROM private.require_manageable_staff_target(p_target_id);

  SELECT jsonb_build_object(
    'can_approve_overrides', sp.can_approve_overrides,
    'can_void_payments', sp.can_void_payments,
    'can_process_lost_tickets', sp.can_process_lost_tickets,
    'can_correct_session_times', sp.can_correct_session_times,
    'can_cancel_sessions', sp.can_cancel_sessions
  )
  INTO v_before
  FROM public.staff_permissions sp
  WHERE sp.profile_id = p_target_id;

  UPDATE public.staff_permissions sp
  SET
    can_approve_overrides = p_can_approve_overrides,
    can_void_payments = p_can_void_payments,
    can_process_lost_tickets = p_can_process_lost_tickets,
    can_correct_session_times = p_can_correct_session_times,
    can_cancel_sessions = p_can_cancel_sessions,
    updated_by = v_actor_id,
    updated_at = clock_timestamp()
  WHERE sp.profile_id = p_target_id;

  PERFORM private.write_staff_audit(
    v_location_id,
    v_actor_id,
    'staff.permissions.update',
    p_target_id,
    'success',
    NULL,
    p_correlation_id,
    v_before,
    jsonb_build_object(
      'can_approve_overrides', p_can_approve_overrides,
      'can_void_payments', p_can_void_payments,
      'can_process_lost_tickets', p_can_process_lost_tickets,
      'can_correct_session_times', p_can_correct_session_times,
      'can_cancel_sessions', p_can_cancel_sessions
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_staff_role(
  p_target_id uuid,
  p_role public.app_role,
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
  v_target record;
BEGIN
  v_location_id := private.require_active_admin();
  v_actor_id := auth.uid();

  IF p_target_id = v_actor_id THEN
    RAISE EXCEPTION 'cannot modify own role' USING ERRCODE = '42501';
  END IF;

  IF p_role NOT IN ('ADMIN'::public.app_role, 'STAFF'::public.app_role) THEN
    RAISE EXCEPTION 'invalid staff role' USING ERRCODE = '22023';
  END IF;

  SELECT *
  INTO v_target
  FROM private.require_manageable_staff_target(p_target_id);

  IF v_target.role = 'ADMIN'::public.app_role
     AND p_role = 'STAFF'::public.app_role
     AND private.active_admin_count(v_location_id, p_target_id) = 0 THEN
    RAISE EXCEPTION 'cannot demote last active admin' USING ERRCODE = '42501';
  END IF;

  UPDATE public.profiles p
  SET
    role = p_role,
    updated_at = clock_timestamp()
  WHERE p.id = p_target_id;

  PERFORM private.write_staff_audit(
    v_location_id,
    v_actor_id,
    'staff.role.update',
    p_target_id,
    'success',
    NULL,
    p_correlation_id,
    jsonb_build_object('role', v_target.role),
    jsonb_build_object('role', p_role)
  );
END;
$$;

REVOKE ALL ON FUNCTION private.require_active_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.require_manageable_staff_target(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.active_admin_count(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.write_staff_audit(uuid, uuid, text, uuid, text, text, uuid, jsonb, jsonb) FROM PUBLIC;

REVOKE ALL ON FUNCTION public.admin_create_staff_profile(uuid, text, public.app_role, boolean, boolean, boolean, boolean, boolean, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_disable_staff(uuid, text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_reactivate_staff(uuid, text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_update_staff_permissions(uuid, boolean, boolean, boolean, boolean, boolean, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_update_staff_role(uuid, public.app_role, uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.admin_create_staff_profile(uuid, text, public.app_role, boolean, boolean, boolean, boolean, boolean, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_disable_staff(uuid, text, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_reactivate_staff(uuid, text, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_update_staff_permissions(uuid, boolean, boolean, boolean, boolean, boolean, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_update_staff_role(uuid, public.app_role, uuid) TO authenticated, service_role;
