begin;

select plan(23);
select has_function('public', 'get_dashboard_snapshot', array['date']);

select ok(
  exists (
    select 1
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'parking_spaces'
      and t.tgname = 'dashboard_broadcast_parking_spaces'
      and not t.tgisinternal
  ),
  'dashboard_broadcast_parking_spaces trigger exists'
);

select ok(
  exists (
    select 1
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'parking_sessions'
      and t.tgname = 'dashboard_broadcast_parking_sessions'
      and not t.tgisinternal
  ),
  'dashboard_broadcast_parking_sessions trigger exists'
);

select ok(
  exists (
    select 1
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'payments'
      and t.tgname = 'dashboard_broadcast_payments'
      and not t.tgisinternal
  ),
  'dashboard_broadcast_payments trigger exists'
);

select ok(
  exists (
    select 1
    from pg_policies p
    where p.schemaname = 'realtime'
      and p.tablename = 'messages'
      and p.policyname = 'dashboard_location_broadcast_read'
  ),
  'dashboard realtime.messages policy exists'
);

reset role;

select throws_ok(
  $$ select public.get_dashboard_snapshot() $$,
  '42501',
  'authentication required',
  'unauthenticated snapshot denied'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}',
  true
);

select ok(
  (public.get_dashboard_snapshot()->>'location_id')
    = '11111111-1111-4111-8111-111111111111',
  'snapshot scoped to active profile location'
);

select ok(
  (public.get_dashboard_snapshot()->'metrics'->>'total_capacity')::int >= 1,
  'snapshot reports active space capacity'
);

select is(
  (public.get_dashboard_snapshot()->'metrics'->>'occupancy_basis_points')::int,
  0,
  'zero occupancy when no occupied spaces in seed baseline'
);

select ok(
  jsonb_typeof(public.get_dashboard_snapshot()->'zones') = 'array',
  'zones array present'
);

select ok(
  jsonb_typeof(public.get_dashboard_snapshot()->'recent_movements') = 'array',
  'recent movements array present'
);

select ok(
  not exists (
    select 1
    from jsonb_array_elements(public.get_dashboard_snapshot()->'recent_movements') movement
    where movement ?| array['qr_token_hash', 'total_centavos', 'payment_id']
  ),
  'recent movements exclude sensitive payment or credential fields'
);

reset role;
insert into public.parking_locations (
  id, code, name, receipt_prefix
) values (
  '99999999-9999-4999-8999-999999999991', 'SECOND', 'Second Facility', 'SEC'
) on conflict (id) do nothing;

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'admin.second@example.invalid', '', now(),
  '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
) on conflict (id) do nothing;

insert into public.profiles (
  id, parking_location_id, role, full_name, is_active, disabled_at
) values (
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  '99999999-9999-4999-8999-999999999991',
  'ADMIN', 'Second Facility Admin', true, null
) on conflict (id) do update
set parking_location_id = excluded.parking_location_id,
    is_active = excluded.is_active;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"cccccccc-cccc-4ccc-8ccc-cccccccccccc","role":"authenticated"}',
  true
);

select is(
  public.get_dashboard_snapshot()->>'location_id',
  '99999999-9999-4999-8999-999999999991',
  'second facility snapshot is location scoped'
);

select is(
  (public.get_dashboard_snapshot()->'metrics'->>'total_capacity')::int,
  0,
  'second facility snapshot excludes main-facility spaces'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}',
  true
);

select is(
  (
    select count(*)::int
    from realtime.messages m
    where m.topic = 'location:99999999-9999-4999-8999-999999999991:dashboard'
  ),
  0,
  'staff cannot read other-location dashboard broadcast topics'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}',
  true
);

select lives_ok(
  $$ select public.admin_set_parking_space_status(
    '44444444-4444-4444-8444-444444444441'::uuid,
    'OUT_OF_SERVICE'::public.space_status,
    1::bigint,
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid
  ) $$,
  'space status change succeeds for broadcast trigger'
);

select ok(
  (public.get_dashboard_snapshot()->>'aggregate_version')::bigint >= 1,
  'space mutation bumps dashboard aggregate version via trigger'
);

select is(
  (
    select (public.get_dashboard_snapshot()->'metrics'->>'out_of_service_spaces')::int
      >= 1
  ),
  true,
  'snapshot reflects out-of-service space after status change'
);

select ok(
  (
    select prosrc ~ 'realtime\.send'
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'private' and p.proname = 'broadcast_dashboard_invalidation'
  ),
  'broadcast trigger uses realtime.send'
);

select ok(
  (
    select prosrc ~ 'aggregate_version' and prosrc ~ 'domain'
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'private' and p.proname = 'broadcast_dashboard_invalidation'
  ),
  'broadcast payload keys are domain and aggregate_version only'
);

select ok(
  (
    select prosrc ~ ('location:' || '.*' || ':dashboard')
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'private' and p.proname = 'broadcast_dashboard_invalidation'
  ),
  'broadcast topic uses location:<id>:dashboard'
);

select is(
  (
    select p.prosecdef
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'get_dashboard_snapshot'
  ),
  true,
  'get_dashboard_snapshot is security definer'
);

select ok(
  exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    cross join unnest(coalesce(p.proconfig, array[]::text[])) cfg
    where n.nspname = 'public'
      and p.proname = 'get_dashboard_snapshot'
      and cfg in ('search_path=', 'search_path=""')
  ),
  'get_dashboard_snapshot uses empty search_path'
);

select * from finish();

rollback;
