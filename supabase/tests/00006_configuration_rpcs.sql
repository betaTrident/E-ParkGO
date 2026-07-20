begin;

select plan(33);

-- Function existence
select has_function(
  'public',
  'admin_update_facility_settings',
  array['text', 'text', 'text', 'jsonb', 'uuid']
);
select has_function(
  'public',
  'admin_create_parking_zone',
  array['text', 'text', 'integer', 'uuid']
);
select has_function(
  'public',
  'admin_update_parking_zone',
  array['uuid', 'text', 'integer', 'uuid']
);
select has_function(
  'public',
  'admin_deactivate_parking_zone',
  array['uuid', 'uuid']
);
select has_function(
  'public',
  'admin_create_vehicle_type',
  array['text', 'text', 'uuid']
);
select has_function(
  'public',
  'admin_create_parking_space',
  array['uuid', 'text', 'uuid', 'uuid']
);
select has_function(
  'public',
  'admin_set_parking_space_status',
  array['uuid', 'public.space_status', 'bigint', 'uuid']
);
select has_function(
  'public',
  'admin_create_rate_draft',
  array[
    'uuid', 'public.rate_mode', 'integer', 'integer', 'bigint', 'integer', 'bigint',
    'bigint', 'bigint', 'bigint', 'bigint', 'timestamptz', 'timestamptz', 'uuid'
  ]
);
select has_function(
  'public',
  'admin_publish_rate',
  array['uuid', 'uuid']
);
select has_function(
  'public',
  'admin_retire_published_rate',
  array['uuid', 'timestamptz', 'uuid']
);

reset role;

-- Cross-location admin
insert into public.parking_locations (id, code, name, receipt_prefix)
values ('99999999-9999-4999-8999-999999999992', 'CFG2', 'Config Test Facility', 'CFG')
on conflict (id) do nothing;

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values (
  'ffffffff-ffff-4fff-8fff-ffffffffffff',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'admin.cfg2@example.invalid', '', now(),
  '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
)
on conflict (id) do nothing;

insert into public.profiles (id, parking_location_id, role, full_name, is_active)
values (
  'ffffffff-ffff-4fff-8fff-ffffffffffff',
  '99999999-9999-4999-8999-999999999992',
  'ADMIN', 'Config Facility Admin', true
)
on conflict (id) do nothing;

insert into public.parking_zones (id, parking_location_id, code, name, sort_order, is_active)
values (
  '88888888-8888-4888-8888-888888888881',
  '99999999-9999-4999-8999-999999999992',
  'Z2', 'Zone Two', 1, true
)
on conflict (id) do nothing;

-- Unauthenticated denied
select throws_ok(
  $$ select public.admin_update_facility_settings(
    'Name', 'Asia/Manila', 'EPG', '{}'::jsonb,
    '11111111-1111-4111-8111-111111111111'::uuid
  ) $$,
  '42501',
  'authentication required',
  'unauthenticated facility update denied'
);

-- Staff cannot mutate configuration
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}',
  true
);

select throws_ok(
  $$ select public.admin_create_parking_zone(
    'C', 'Zone C', 3,
    '11111111-1111-4111-8111-111111111111'::uuid
  ) $$,
  '42501',
  'admin authorization required',
  'staff cannot create zones'
);

-- Admin bootstrap context
select set_config(
  'request.jwt.claims',
  '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}',
  true
);

-- Invalid facility settings
select throws_ok(
  $$ select public.admin_update_facility_settings(
    '', 'Asia/Manila', 'EPG', '{}'::jsonb,
    '11111111-1111-4111-8111-111111111111'::uuid
  ) $$,
  '22023',
  'facility name is required',
  'blank facility name rejected'
);

-- Duplicate zone code
select lives_ok(
  $$ select public.admin_create_parking_zone(
    'C', 'Zone C', 3,
    '11111111-1111-4111-8111-111111111111'::uuid
  ) $$,
  'admin creates zone C'
);

select throws_ok(
  $$ select public.admin_create_parking_zone(
    'C', 'Zone C duplicate', 4,
    '11111111-1111-4111-8111-111111111111'::uuid
  ) $$,
  '23505',
  null,
  'duplicate zone code rejected'
);

-- Cross-location zone reference on space create
select throws_ok(
  $$ select public.admin_create_parking_space(
    '88888888-8888-4888-8888-888888888881',
    'X-01',
    '33333333-3333-4333-8333-333333333331',
    '11111111-1111-4111-8111-111111111111'::uuid
  ) $$,
  '42501',
  'zone not found in admin location',
  'cross-location zone rejected for space create'
);

-- Space status version conflict
select is(
  public.admin_set_parking_space_status(
    '44444444-4444-4444-8444-444444444441',
    'OUT_OF_SERVICE'::public.space_status,
    1,
    '11111111-1111-4111-8111-111111111111'::uuid
  ),
  2::bigint,
  'space status update bumps version'
);

select throws_ok(
  $$ select public.admin_set_parking_space_status(
    '44444444-4444-4444-8444-444444444441',
    'AVAILABLE'::public.space_status,
    1,
    '11111111-1111-4111-8111-111111111111'::uuid
  ) $$,
  '22023',
  'space version conflict',
  'stale expected version rejected'
);

-- Restore available for downstream tests
select is(
  public.admin_set_parking_space_status(
    '44444444-4444-4444-8444-444444444441',
    'AVAILABLE'::public.space_status,
    2,
    '11111111-1111-4111-8111-111111111111'::uuid
  ),
  3::bigint,
  'space restored to available'
);

-- Rate mode validation: negative centavos
select throws_ok(
  $$ select public.admin_create_rate_draft(
    '33333333-3333-4333-8333-333333333332',
    'FLAT'::public.rate_mode,
    15,
    null, null, null, null,
    -100,
    null,
    0,
    10000,
    '2026-08-01T00:00:00+08:00'::timestamptz,
    null,
    '11111111-1111-4111-8111-111111111111'::uuid
  ) $$,
  '22023',
  'fee amounts must be nonnegative',
  'negative centavos rejected'
);

-- Tiered draft requires tiered fields
select throws_ok(
  $$ select public.admin_create_rate_draft(
    '33333333-3333-4333-8333-333333333332',
    'TIERED'::public.rate_mode,
    15,
    null, null, null, null,
    null,
    null,
    0,
    10000,
    '2026-08-01T00:00:00+08:00'::timestamptz,
    null,
    '11111111-1111-4111-8111-111111111111'::uuid
  ) $$,
  '22023',
  'tiered rate requires initial and succeeding fields',
  'incomplete tiered draft rejected'
);

-- Create and publish tiered draft (non-overlapping effective window)
select isnt(
  public.admin_create_rate_draft(
    '33333333-3333-4333-8333-333333333332',
    'TIERED'::public.rate_mode,
    15,
    180, 5000, 60, 2000,
    null,
    30000,
    5000,
    20000,
    '2026-08-01T00:00:00+08:00'::timestamptz,
    null,
    '11111111-1111-4111-8111-111111111111'::uuid
  ),
  null,
  'tiered draft created'
);

select isnt(
  (
    select public.admin_create_rate_draft(
      '33333333-3333-4333-8333-333333333332',
      'FLAT'::public.rate_mode,
      15,
      null, null, null, null,
      3000,
      null,
      0,
      10000,
      '2026-09-01T00:00:00+08:00'::timestamptz,
      null,
      '11111111-1111-4111-8111-111111111111'::uuid
    )
  ),
  null,
  'second draft for publish tests created'
);

select lives_ok(
  format(
    $$ select public.admin_publish_rate('%s', '%s'::uuid) $$,
    (
      select id::text
      from public.parking_rates
      where parking_location_id = '11111111-1111-4111-8111-111111111111'
        and vehicle_type_id = '33333333-3333-4333-8333-333333333332'
        and is_published = false
        and mode = 'FLAT'::public.rate_mode
      order by version desc
      limit 1
    ),
    '11111111-1111-4111-8111-111111111111'
  ),
  'flat draft publishes successfully'
);

-- Published immutability
select throws_ok(
  format(
    $$ update public.parking_rates set flat_fee_centavos = 9999 where id = '%s' $$,
    (
      select id::text
      from public.parking_rates
      where parking_location_id = '11111111-1111-4111-8111-111111111111'
        and is_published = true
        and vehicle_type_id = '33333333-3333-4333-8333-333333333332'
        and mode = 'FLAT'::public.rate_mode
      order by version desc
      limit 1
    )
  ),
  '42501',
  null,
  'published rate rows are immutable'
);

-- Overlap publish rejected
select throws_ok(
  format(
    $$ select public.admin_publish_rate('%s', '%s'::uuid) $$,
    (
      select id::text
      from public.parking_rates
      where parking_location_id = '11111111-1111-4111-8111-111111111111'
        and vehicle_type_id = '33333333-3333-4333-8333-333333333332'
        and is_published = false
        and mode = 'TIERED'::public.rate_mode
      limit 1
    ),
    '11111111-1111-4111-8111-111111111111'
  ),
  '23P01',
  null,
  'overlapping published rate rejected'
);

-- Historical zone deactivation (not delete)
select lives_ok(
  $$ select public.admin_deactivate_parking_zone(
    '22222222-2222-4222-8222-222222222222',
    '11111111-1111-4111-8111-111111111111'::uuid
  ) $$,
  'zone deactivated instead of deleted'
);

select is(
  (select is_active from public.parking_zones where id = '22222222-2222-4222-8222-222222222222'),
  false,
  'zone row remains after deactivation'
);

-- Audit evidence for facility update
select lives_ok(
  $$ select public.admin_update_facility_settings(
    'E-ParkGO Pilot Facility',
    'Asia/Manila',
    'EPG',
    '{"grace_display_minutes": 15}'::jsonb,
    '11111111-1111-4111-8111-111111111111'::uuid
  ) $$,
  'facility settings update succeeds'
);

select ok(
  exists (
    select 1
    from public.audit_logs al
    where al.parking_location_id = '11111111-1111-4111-8111-111111111111'
      and al.action = 'facility.settings.update'
      and al.target_type = 'parking_location'
  ),
  'facility settings update writes audit row'
);

-- Grants: authenticated may execute, anon may not
select ok(
  has_function_privilege(
    'anon',
    'public.admin_publish_rate(uuid, uuid)',
    'EXECUTE'
  ) = false,
  'anon cannot execute publish_rate'
);

select ok(
  has_function_privilege(
    'authenticated',
    'public.admin_publish_rate(uuid, uuid)',
    'EXECUTE'
  ),
  'authenticated may execute publish_rate'
);

-- search_path hardening on configuration audit helper
select ok(
  (
    select exists (
      select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'private'
        and p.proname = 'write_configuration_audit'
        and exists (
          select 1
          from unnest(coalesce(p.proconfig, array[]::text[])) as cfg(setting)
          where setting like 'search_path=%'
        )
    )
  ),
  'write_configuration_audit uses empty search_path'
);

select * from finish();
rollback;
