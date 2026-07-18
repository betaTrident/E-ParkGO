-- Phase 3: locations, identity, permissions, zones, spaces, vehicle types, devices.

CREATE TABLE public.parking_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code citext NOT NULL UNIQUE,
  name text NOT NULL,
  timezone text NOT NULL DEFAULT 'Asia/Manila',
  currency char(3) NOT NULL DEFAULT 'PHP',
  receipt_prefix text NOT NULL,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT parking_locations_name_not_blank CHECK (btrim(name) <> ''),
  CONSTRAINT parking_locations_code_not_blank CHECK (btrim(code::text) <> ''),
  CONSTRAINT parking_locations_receipt_prefix_not_blank CHECK (btrim(receipt_prefix) <> ''),
  CONSTRAINT parking_locations_timezone_not_blank CHECK (btrim(timezone) <> ''),
  CONSTRAINT parking_locations_currency_format CHECK (currency ~ '^[A-Z]{3}$')
);

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE RESTRICT,
  parking_location_id uuid NOT NULL REFERENCES public.parking_locations (id) ON DELETE RESTRICT,
  role public.app_role NOT NULL DEFAULT 'STAFF',
  full_name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  disabled_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, parking_location_id),
  CONSTRAINT profiles_full_name_not_blank CHECK (btrim(full_name) <> ''),
  CONSTRAINT profiles_disabled_consistency CHECK (
    (is_active = true AND disabled_at IS NULL)
    OR (is_active = false AND disabled_at IS NOT NULL)
  )
);

CREATE TABLE public.staff_permissions (
  profile_id uuid PRIMARY KEY REFERENCES public.profiles (id) ON DELETE CASCADE,
  can_approve_overrides boolean NOT NULL DEFAULT false,
  can_void_payments boolean NOT NULL DEFAULT false,
  can_process_lost_tickets boolean NOT NULL DEFAULT false,
  can_correct_session_times boolean NOT NULL DEFAULT false,
  can_cancel_sessions boolean NOT NULL DEFAULT false,
  updated_by uuid NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.parking_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parking_location_id uuid NOT NULL REFERENCES public.parking_locations (id) ON DELETE RESTRICT,
  code citext NOT NULL,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (parking_location_id, code),
  UNIQUE (id, parking_location_id),
  CONSTRAINT parking_zones_name_not_blank CHECK (btrim(name) <> ''),
  CONSTRAINT parking_zones_code_not_blank CHECK (btrim(code::text) <> '')
);

CREATE TABLE public.vehicle_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parking_location_id uuid NOT NULL REFERENCES public.parking_locations (id) ON DELETE RESTRICT,
  code citext NOT NULL,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (parking_location_id, code),
  UNIQUE (id, parking_location_id),
  CONSTRAINT vehicle_types_name_not_blank CHECK (btrim(name) <> ''),
  CONSTRAINT vehicle_types_code_not_blank CHECK (btrim(code::text) <> '')
);

CREATE TABLE public.parking_spaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parking_location_id uuid NOT NULL,
  zone_id uuid NOT NULL,
  code citext NOT NULL,
  vehicle_type_id uuid NULL,
  status public.space_status NOT NULL DEFAULT 'AVAILABLE',
  version bigint NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (parking_location_id, code),
  UNIQUE (id, parking_location_id),
  CONSTRAINT parking_spaces_code_not_blank CHECK (btrim(code::text) <> ''),
  CONSTRAINT parking_spaces_version_positive CHECK (version > 0),
  CONSTRAINT parking_spaces_zone_fk FOREIGN KEY (zone_id, parking_location_id)
    REFERENCES public.parking_zones (id, parking_location_id) ON DELETE RESTRICT,
  CONSTRAINT parking_spaces_vehicle_type_fk FOREIGN KEY (vehicle_type_id, parking_location_id)
    REFERENCES public.vehicle_types (id, parking_location_id) ON DELETE RESTRICT
);

CREATE TABLE public.devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parking_location_id uuid NOT NULL REFERENCES public.parking_locations (id) ON DELETE RESTRICT,
  name text NOT NULL,
  public_identifier citext NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  last_seen_at timestamptz NULL,
  revoked_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, parking_location_id),
  CONSTRAINT devices_name_not_blank CHECK (btrim(name) <> ''),
  CONSTRAINT devices_public_identifier_not_blank CHECK (btrim(public_identifier::text) <> '')
);

CREATE TRIGGER parking_locations_set_updated_at
  BEFORE UPDATE ON public.parking_locations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER staff_permissions_set_updated_at
  BEFORE UPDATE ON public.staff_permissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER parking_zones_set_updated_at
  BEFORE UPDATE ON public.parking_zones
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER vehicle_types_set_updated_at
  BEFORE UPDATE ON public.vehicle_types
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER parking_spaces_set_updated_at
  BEFORE UPDATE ON public.parking_spaces
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER devices_set_updated_at
  BEFORE UPDATE ON public.devices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
