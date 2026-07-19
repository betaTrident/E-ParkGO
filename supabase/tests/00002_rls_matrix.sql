begin;

select plan(202);

-- Every application table is protected by RLS.
select ok(
  c.relrowsecurity,
  format('%I has RLS enabled', tables.table_name)
)
from unnest(array[
  'parking_locations', 'profiles', 'staff_permissions', 'parking_zones',
  'vehicle_types', 'parking_spaces', 'devices', 'vehicles', 'parking_rates',
  'parking_sessions', 'parking_rate_snapshots', 'parking_tickets',
  'staff_shifts', 'payments', 'receipts', 'session_corrections', 'audit_logs',
  'idempotency_keys', 'rate_limit_buckets'
]::text[]) as tables(table_name)
join pg_class c on c.oid = format('public.%I', tables.table_name)::regclass;

-- Anonymous callers receive no table privileges for any verb.
select ok(
  not has_table_privilege('anon', format('public.%I', matrix.table_name), matrix.verb),
  format('anon cannot %s public.%I', matrix.verb, matrix.table_name)
)
from unnest(array[
  'parking_locations', 'profiles', 'staff_permissions', 'parking_zones',
  'vehicle_types', 'parking_spaces', 'devices', 'vehicles', 'parking_rates',
  'parking_sessions', 'parking_rate_snapshots', 'parking_tickets',
  'staff_shifts', 'payments', 'receipts', 'session_corrections', 'audit_logs',
  'idempotency_keys', 'rate_limit_buckets'
]::text[]) as tables(table_name)
cross join unnest(array['SELECT', 'INSERT', 'UPDATE', 'DELETE']::text[]) as verbs(verb)
cross join lateral (select tables.table_name, verbs.verb) as matrix;

-- Authenticated users have SELECT only on the intentionally exposed tables.
select ok(
  has_table_privilege('authenticated', format('public.%I', tables.table_name), 'SELECT'),
  format('authenticated can SELECT public.%I', tables.table_name)
)
from unnest(array[
  'parking_locations', 'profiles', 'staff_permissions', 'parking_zones',
  'vehicle_types', 'parking_spaces', 'devices', 'vehicles', 'parking_rates',
  'parking_sessions', 'parking_rate_snapshots', 'parking_tickets',
  'staff_shifts', 'payments', 'receipts', 'session_corrections', 'audit_logs'
]::text[]) as tables(table_name);

select ok(
  not has_table_privilege('authenticated', format('public.%I', tables.table_name), 'SELECT'),
  format('authenticated cannot SELECT private workflow table public.%I', tables.table_name)
)
from unnest(array['idempotency_keys', 'rate_limit_buckets']::text[]) as tables(table_name);

select ok(
  not has_table_privilege('authenticated', format('public.%I', matrix.table_name), matrix.verb),
  format('authenticated cannot %s public.%I directly', matrix.verb, matrix.table_name)
)
from unnest(array[
  'parking_locations', 'profiles', 'staff_permissions', 'parking_zones',
  'vehicle_types', 'parking_spaces', 'devices', 'vehicles', 'parking_rates',
  'parking_sessions', 'parking_rate_snapshots', 'parking_tickets',
  'staff_shifts', 'payments', 'receipts', 'session_corrections', 'audit_logs',
  'idempotency_keys', 'rate_limit_buckets'
]::text[]) as tables(table_name)
cross join unnest(array['INSERT', 'UPDATE', 'DELETE']::text[]) as verbs(verb)
cross join lateral (select tables.table_name, verbs.verb) as matrix;

-- Exposed tables have an authenticated SELECT policy; internal workflow tables do not.
select ok(
  exists (
    select 1
    from pg_policies p
    where p.schemaname = 'public'
      and p.tablename = tables.table_name
      and p.cmd = 'SELECT'
      and 'authenticated' = any(p.roles)
  ),
  format('public.%I has an authenticated SELECT policy', tables.table_name)
)
from unnest(array[
  'parking_locations', 'profiles', 'staff_permissions', 'parking_zones',
  'vehicle_types', 'parking_spaces', 'devices', 'vehicles', 'parking_rates',
  'parking_sessions', 'parking_rate_snapshots', 'parking_tickets',
  'staff_shifts', 'payments', 'receipts', 'session_corrections', 'audit_logs'
]::text[]) as tables(table_name);

select ok(
  not exists (
    select 1
    from pg_policies p
    where p.schemaname = 'public' and p.tablename = tables.table_name
  ),
  format('public.%I remains default-deny without policies', tables.table_name)
)
from unnest(array['idempotency_keys', 'rate_limit_buckets']::text[]) as tables(table_name);

-- Add a second tenant and an inactive identity to exercise identity/role/location boundaries.
reset role;

insert into public.parking_locations (
  id, code, name, receipt_prefix
) values (
  '99999999-9999-4999-8999-999999999991', 'SECOND', 'Second Facility', 'SEC'
);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  (
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'admin.second@example.invalid', '', now(),
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
  ),
  (
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'inactive@example.invalid', '', now(),
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
  );

insert into public.profiles (
  id, parking_location_id, role, full_name, is_active, disabled_at
) values
  (
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    '99999999-9999-4999-8999-999999999991',
    'ADMIN', 'Second Facility Admin', true, null
  ),
  (
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    '11111111-1111-4111-8111-111111111111',
    'STAFF', 'Inactive Staff', false, clock_timestamp()
  );

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}',
  true
);

select is((select count(*)::int from public.parking_locations), 1, 'admin sees only assigned location');
select is((select count(*)::int from public.profiles), 3, 'admin sees active and inactive profiles in own location');
select is(
  (select count(*)::int from public.profiles where parking_location_id = '99999999-9999-4999-8999-999999999991'),
  0,
  'admin cannot see profiles in another location'
);
select is((select count(*)::int from public.audit_logs), 0, 'admin sees only own-location audit logs');

select set_config(
  'request.jwt.claims',
  '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}',
  true
);

select is((select count(*)::int from public.profiles), 1, 'staff sees only their own profile');
select is((select count(*)::int from public.parking_locations), 1, 'staff sees only assigned location');
select is((select count(*)::int from public.parking_spaces), 3, 'staff sees same-location operational rows');
select is((select count(*)::int from public.audit_logs), 0, 'staff cannot read audit logs');

select set_config(
  'request.jwt.claims',
  '{"sub":"cccccccc-cccc-4ccc-8ccc-cccccccccccc","role":"authenticated"}',
  true
);

select is((select count(*)::int from public.parking_locations), 1, 'second-location admin sees assigned location');
select is((select count(*)::int from public.profiles), 1, 'second-location admin cannot see first-location profiles');

select set_config(
  'request.jwt.claims',
  '{"sub":"dddddddd-dddd-4ddd-8ddd-dddddddddddd","role":"authenticated"}',
  true
);

select is((select count(*)::int from public.parking_locations), 0, 'inactive identity sees no locations');
select is((select count(*)::int from public.profiles), 0, 'inactive identity cannot read even its own profile');

select * from finish();
rollback;
