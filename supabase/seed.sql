-- Deterministic local/staging seed. Idempotent via ON CONFLICT.

INSERT INTO public.parking_locations (
  id,
  code,
  name,
  timezone,
  currency,
  receipt_prefix,
  settings,
  is_active
)
VALUES (
  '11111111-1111-4111-8111-111111111111',
  'MAIN',
  'E-ParkGO Pilot Facility',
  'Asia/Manila',
  'PHP',
  'EPG',
  '{"grace_display_minutes": 15}'::jsonb,
  true
)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  timezone = EXCLUDED.timezone,
  currency = EXCLUDED.currency,
  receipt_prefix = EXCLUDED.receipt_prefix,
  settings = EXCLUDED.settings,
  is_active = EXCLUDED.is_active,
  updated_at = now();

INSERT INTO public.parking_zones (
  id,
  parking_location_id,
  code,
  name,
  sort_order,
  is_active
)
VALUES
  (
    '22222222-2222-4222-8222-222222222221',
    '11111111-1111-4111-8111-111111111111',
    'A',
    'Zone A',
    1,
    true
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    '11111111-1111-4111-8111-111111111111',
    'B',
    'Zone B',
    2,
    true
  )
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = now();

INSERT INTO public.vehicle_types (
  id,
  parking_location_id,
  code,
  name,
  is_active
)
VALUES
  (
    '33333333-3333-4333-8333-333333333331',
    '11111111-1111-4111-8111-111111111111',
    'CAR',
    'Car',
    true
  ),
  (
    '33333333-3333-4333-8333-333333333332',
    '11111111-1111-4111-8111-111111111111',
    'MOTO',
    'Motorcycle',
    true
  )
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  is_active = EXCLUDED.is_active,
  updated_at = now();

INSERT INTO public.parking_spaces (
  id,
  parking_location_id,
  zone_id,
  code,
  vehicle_type_id,
  status,
  is_active
)
VALUES
  (
    '44444444-4444-4444-8444-444444444441',
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222221',
    'A-01',
    '33333333-3333-4333-8333-333333333331',
    'AVAILABLE',
    true
  ),
  (
    '44444444-4444-4444-8444-444444444442',
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222221',
    'A-02',
    '33333333-3333-4333-8333-333333333331',
    'AVAILABLE',
    true
  ),
  (
    '44444444-4444-4444-8444-444444444443',
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222222',
    'B-01',
    '33333333-3333-4333-8333-333333333332',
    'AVAILABLE',
    true
  )
ON CONFLICT (id) DO UPDATE
SET
  status = EXCLUDED.status,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- Bootstrap admin auth identity (local dev only).
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
VALUES (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'admin@eparkgo.local',
  crypt('Admin123!@#', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
VALUES (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  jsonb_build_object('sub', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'email', 'admin@eparkgo.local'),
  'email',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  now(),
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (
  id,
  parking_location_id,
  role,
  full_name,
  is_active
)
VALUES (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  '11111111-1111-4111-8111-111111111111',
  'ADMIN',
  'Bootstrap Admin',
  true
)
ON CONFLICT (id) DO UPDATE
SET
  role = EXCLUDED.role,
  full_name = EXCLUDED.full_name,
  is_active = EXCLUDED.is_active,
  updated_at = now();

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
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  true,
  true,
  true,
  true,
  true,
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
)
ON CONFLICT (profile_id) DO UPDATE
SET
  can_approve_overrides = EXCLUDED.can_approve_overrides,
  can_void_payments = EXCLUDED.can_void_payments,
  can_process_lost_tickets = EXCLUDED.can_process_lost_tickets,
  can_correct_session_times = EXCLUDED.can_correct_session_times,
  can_cancel_sessions = EXCLUDED.can_cancel_sessions,
  updated_by = EXCLUDED.updated_by,
  updated_at = now();

-- Staff user for RLS matrix tests.
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
VALUES (
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'staff@eparkgo.local',
  crypt('Staff123!@#', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
VALUES (
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  jsonb_build_object('sub', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'email', 'staff@eparkgo.local'),
  'email',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  now(),
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (
  id,
  parking_location_id,
  role,
  full_name,
  is_active
)
VALUES (
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  '11111111-1111-4111-8111-111111111111',
  'STAFF',
  'Pilot Staff',
  true
)
ON CONFLICT (id) DO UPDATE
SET
  role = EXCLUDED.role,
  full_name = EXCLUDED.full_name,
  is_active = EXCLUDED.is_active,
  updated_at = now();

INSERT INTO public.staff_permissions (profile_id)
VALUES ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')
ON CONFLICT (profile_id) DO NOTHING;

-- Published flat rate for pilot vehicle type.
INSERT INTO public.parking_rates (
  id,
  parking_location_id,
  vehicle_type_id,
  version,
  mode,
  grace_minutes,
  flat_fee_centavos,
  overnight_fee_centavos,
  lost_ticket_penalty_centavos,
  effective_from,
  is_published,
  created_by
)
VALUES (
  '55555555-5555-4555-8555-555555555551',
  '11111111-1111-4111-8111-111111111111',
  '33333333-3333-4333-8333-333333333331',
  1,
  'FLAT',
  15,
  5000,
  0,
  10000,
  '2026-01-01T00:00:00+08:00'::timestamptz,
  true,
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
)
ON CONFLICT (id) DO UPDATE
SET
  flat_fee_centavos = EXCLUDED.flat_fee_centavos,
  is_published = EXCLUDED.is_published,
  updated_at = now();
