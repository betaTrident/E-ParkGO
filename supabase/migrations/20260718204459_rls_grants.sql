-- Phase 3/4: authorization helpers, default-deny grants, and RLS policies.

CREATE OR REPLACE FUNCTION private.current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT auth.uid();
$$;

CREATE OR REPLACE FUNCTION private.current_profile_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT auth.uid();
$$;

CREATE OR REPLACE FUNCTION private.is_active_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.is_active = true
      AND p.disabled_at IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION private.current_location_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT p.parking_location_id
  FROM public.profiles p
  WHERE p.id = auth.uid()
    AND p.is_active = true
    AND p.disabled_at IS NULL;
$$;

CREATE OR REPLACE FUNCTION private.current_role()
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT p.role
  FROM public.profiles p
  WHERE p.id = auth.uid()
    AND p.is_active = true
    AND p.disabled_at IS NULL;
$$;

CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT private.current_role() = 'ADMIN'::public.app_role;
$$;

CREATE OR REPLACE FUNCTION private.has_staff_permission(p_permission text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT CASE p_permission
    WHEN 'can_approve_overrides' THEN sp.can_approve_overrides
    WHEN 'can_void_payments' THEN sp.can_void_payments
    WHEN 'can_process_lost_tickets' THEN sp.can_process_lost_tickets
    WHEN 'can_correct_session_times' THEN sp.can_correct_session_times
    WHEN 'can_cancel_sessions' THEN sp.can_cancel_sessions
    ELSE false
  END
  FROM public.staff_permissions sp
  WHERE sp.profile_id = auth.uid();
$$;

REVOKE ALL ON FUNCTION private.current_user_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.current_profile_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_active_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.current_location_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.current_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.has_staff_permission(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION private.current_user_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.current_profile_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_active_user() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.current_location_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.current_role() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.has_staff_permission(text) TO authenticated, service_role;

-- Default deny on all application tables.
REVOKE ALL ON TABLE public.parking_locations FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.profiles FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.staff_permissions FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.parking_zones FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.vehicle_types FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.parking_spaces FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.devices FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.vehicles FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.parking_rates FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.parking_sessions FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.parking_rate_snapshots FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.parking_tickets FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.staff_shifts FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.payments FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.receipts FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.session_corrections FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.audit_logs FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.idempotency_keys FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.rate_limit_buckets FROM PUBLIC, anon, authenticated;

ALTER TABLE public.parking_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_rate_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_buckets ENABLE ROW LEVEL SECURITY;

-- parking_locations
CREATE POLICY parking_locations_select_assigned
  ON public.parking_locations
  FOR SELECT
  TO authenticated
  USING (
    private.is_active_user()
    AND id = private.current_location_id()
    AND is_active = true
  );

-- profiles
CREATE POLICY profiles_select_self_or_admin
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    private.is_active_user()
    AND (
      id = private.current_profile_id()
      OR (
        private.is_admin()
        AND parking_location_id = private.current_location_id()
      )
    )
  );

-- staff_permissions
CREATE POLICY staff_permissions_select_self_or_admin
  ON public.staff_permissions
  FOR SELECT
  TO authenticated
  USING (
    private.is_active_user()
    AND (
      profile_id = private.current_profile_id()
      OR (
        private.is_admin()
        AND EXISTS (
          SELECT 1
          FROM public.profiles p
          WHERE p.id = staff_permissions.profile_id
            AND p.parking_location_id = private.current_location_id()
        )
      )
    )
  );

-- parking_zones
CREATE POLICY parking_zones_select_same_location
  ON public.parking_zones
  FOR SELECT
  TO authenticated
  USING (
    private.is_active_user()
    AND parking_location_id = private.current_location_id()
    AND (is_active = true OR private.is_admin())
  );

-- vehicle_types
CREATE POLICY vehicle_types_select_same_location
  ON public.vehicle_types
  FOR SELECT
  TO authenticated
  USING (
    private.is_active_user()
    AND parking_location_id = private.current_location_id()
    AND (is_active = true OR private.is_admin())
  );

-- parking_spaces
CREATE POLICY parking_spaces_select_same_location
  ON public.parking_spaces
  FOR SELECT
  TO authenticated
  USING (
    private.is_active_user()
    AND parking_location_id = private.current_location_id()
  );

-- devices
CREATE POLICY devices_select_same_location
  ON public.devices
  FOR SELECT
  TO authenticated
  USING (
    private.is_active_user()
    AND parking_location_id = private.current_location_id()
    AND (is_active = true OR private.is_admin())
  );

-- vehicles
CREATE POLICY vehicles_select_same_location
  ON public.vehicles
  FOR SELECT
  TO authenticated
  USING (
    private.is_active_user()
    AND parking_location_id = private.current_location_id()
  );

-- parking_rates
CREATE POLICY parking_rates_select_same_location
  ON public.parking_rates
  FOR SELECT
  TO authenticated
  USING (
    private.is_active_user()
    AND parking_location_id = private.current_location_id()
    AND (
      private.is_admin()
      OR (
        is_published = true
        AND effective_from <= now()
        AND (effective_to IS NULL OR effective_to > now())
      )
    )
  );

-- parking_sessions
CREATE POLICY parking_sessions_select_same_location
  ON public.parking_sessions
  FOR SELECT
  TO authenticated
  USING (
    private.is_active_user()
    AND parking_location_id = private.current_location_id()
  );

-- parking_rate_snapshots
CREATE POLICY parking_rate_snapshots_select_same_location
  ON public.parking_rate_snapshots
  FOR SELECT
  TO authenticated
  USING (
    private.is_active_user()
    AND parking_location_id = private.current_location_id()
  );

-- parking_tickets (token hash readable only to same-location staff; RPCs sanitize API responses)
CREATE POLICY parking_tickets_select_same_location
  ON public.parking_tickets
  FOR SELECT
  TO authenticated
  USING (
    private.is_active_user()
    AND parking_location_id = private.current_location_id()
  );

-- staff_shifts
CREATE POLICY staff_shifts_select_own_or_admin
  ON public.staff_shifts
  FOR SELECT
  TO authenticated
  USING (
    private.is_active_user()
    AND parking_location_id = private.current_location_id()
    AND (
      profile_id = private.current_profile_id()
      OR private.is_admin()
    )
  );

-- payments
CREATE POLICY payments_select_same_location
  ON public.payments
  FOR SELECT
  TO authenticated
  USING (
    private.is_active_user()
    AND parking_location_id = private.current_location_id()
  );

-- receipts
CREATE POLICY receipts_select_same_location
  ON public.receipts
  FOR SELECT
  TO authenticated
  USING (
    private.is_active_user()
    AND parking_location_id = private.current_location_id()
  );

-- session_corrections
CREATE POLICY session_corrections_select_same_location
  ON public.session_corrections
  FOR SELECT
  TO authenticated
  USING (
    private.is_active_user()
    AND parking_location_id = private.current_location_id()
  );

-- audit_logs (admin only)
CREATE POLICY audit_logs_select_admin_same_location
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (
    private.is_active_user()
    AND private.is_admin()
    AND parking_location_id = private.current_location_id()
  );

-- Explicit SELECT grants only. Mutations go through SECURITY DEFINER RPCs in later phases.
GRANT SELECT ON TABLE public.parking_locations TO authenticated;
GRANT SELECT ON TABLE public.profiles TO authenticated;
GRANT SELECT ON TABLE public.staff_permissions TO authenticated;
GRANT SELECT ON TABLE public.parking_zones TO authenticated;
GRANT SELECT ON TABLE public.vehicle_types TO authenticated;
GRANT SELECT ON TABLE public.parking_spaces TO authenticated;
GRANT SELECT ON TABLE public.devices TO authenticated;
GRANT SELECT ON TABLE public.vehicles TO authenticated;
GRANT SELECT ON TABLE public.parking_rates TO authenticated;
GRANT SELECT ON TABLE public.parking_sessions TO authenticated;
GRANT SELECT ON TABLE public.parking_rate_snapshots TO authenticated;
GRANT SELECT ON TABLE public.parking_tickets TO authenticated;
GRANT SELECT ON TABLE public.staff_shifts TO authenticated;
GRANT SELECT ON TABLE public.payments TO authenticated;
GRANT SELECT ON TABLE public.receipts TO authenticated;
GRANT SELECT ON TABLE public.session_corrections TO authenticated;
GRANT SELECT ON TABLE public.audit_logs TO authenticated;

-- Service role retains full access for trusted server workflows.
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
