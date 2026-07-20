begin;

select plan(27);

select has_function(
  'public',
  'admin_create_staff_profile',
  array['uuid', 'text', 'public.app_role', 'boolean', 'boolean', 'boolean', 'boolean', 'boolean', 'uuid']
);
select has_function(
  'public',
  'admin_disable_staff',
  array['uuid', 'text', 'uuid']
);
select has_function(
  'public',
  'admin_reactivate_staff',
  array['uuid', 'text', 'uuid']
);
select has_function(
  'public',
  'admin_update_staff_permissions',
  array['uuid', 'boolean', 'boolean', 'boolean', 'boolean', 'boolean', 'uuid']
);
select has_function(
  'public',
  'admin_update_staff_role',
  array['uuid', 'public.app_role', 'uuid']
);

reset role;

insert into public.parking_locations (
  id, code, name, receipt_prefix
) values (
  '99999999-9999-4999-8999-999999999991', 'SECOND', 'Second Facility', 'SEC'
)
on conflict (id) do nothing;

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
  ),
  (
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'new.staff@example.invalid', '', now(),
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
  )
on conflict (id) do nothing;

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
  )
on conflict (id) do nothing;

select is(
  private.active_admin_count(
    '11111111-1111-4111-8111-111111111111'::uuid,
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  ),
  0,
  'bootstrap admin is the only active admin when excluded from the count'
);

select throws_ok(
  $$ select public.admin_disable_staff(
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'policy',
    '11111111-1111-4111-8111-111111111111'::uuid
  ) $$,
  '42501',
  'authentication required',
  'unauthenticated disable is denied'
);

select throws_ok(
  $$ select public.admin_create_staff_profile(
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    'New Staff',
    'STAFF'::public.app_role,
    false, false, false, false, false,
    '11111111-1111-4111-8111-111111111111'::uuid
  ) $$,
  '42501',
  'authentication required',
  'unauthenticated profile create is denied'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"dddddddd-dddd-4ddd-8ddd-dddddddddddd","role":"authenticated"}',
  true
);

select throws_ok(
  $$ select public.admin_disable_staff(
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'policy',
    '11111111-1111-4111-8111-111111111111'::uuid
  ) $$,
  '42501',
  'admin authorization required',
  'inactive identity cannot disable staff'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}',
  true
);

select throws_ok(
  $$ select public.admin_disable_staff(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'policy',
    '11111111-1111-4111-8111-111111111111'::uuid
  ) $$,
  '42501',
  'admin authorization required',
  'ordinary staff cannot disable admin'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"cccccccc-cccc-4ccc-8ccc-cccccccccccc","role":"authenticated"}',
  true
);

select throws_ok(
  $$ select public.admin_disable_staff(
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'policy',
    '11111111-1111-4111-8111-111111111111'::uuid
  ) $$,
  '42501',
  'staff target not found in admin location',
  'cross-location admin cannot manage first-location staff'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}',
  true
);

select throws_ok(
  $$ select public.admin_disable_staff(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'policy',
    '11111111-1111-4111-8111-111111111111'::uuid
  ) $$,
  '42501',
  'cannot disable own account',
  'admin cannot disable self'
);

select throws_ok(
  $$ select public.admin_update_staff_permissions(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    false, false, false, false, false,
    '11111111-1111-4111-8111-111111111111'::uuid
  ) $$,
  '42501',
  'cannot modify own permissions',
  'admin cannot self-elevate permissions'
);

select throws_ok(
  $$ select public.admin_update_staff_role(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'STAFF'::public.app_role,
    '11111111-1111-4111-8111-111111111111'::uuid
  ) $$,
  '42501',
  'cannot modify own role',
  'admin cannot change own role'
);

select lives_ok(
  $$ select public.admin_create_staff_profile(
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    'Created Staff',
    'STAFF'::public.app_role,
    true, false, false, false, false,
    '22222222-2222-4222-8222-222222222221'::uuid
  ) $$,
  'admin can create a same-location staff profile'
);

select is(
  (select count(*)::int from public.audit_logs where action = 'staff.profile.create'),
  1,
  'profile creation writes an audit row'
);

select lives_ok(
  $$ select public.admin_update_staff_permissions(
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    true, true, false, false, false,
    '22222222-2222-4222-8222-222222222222'::uuid
  ) $$,
  'admin can update staff permissions for another profile'
);

select is(
  (
    select sp.can_void_payments
    from public.staff_permissions sp
    where sp.profile_id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'
  ),
  true,
  'permission update persists'
);

select lives_ok(
  $$ select public.admin_disable_staff(
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    'temporary suspension',
    '22222222-2222-4222-8222-222222222223'::uuid
  ) $$,
  'admin can disable staff in same location'
);

select is(
  (select p.is_active from public.profiles p where p.id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'),
  false,
  'disabled staff profile is inactive'
);

select lives_ok(
  $$ select public.admin_reactivate_staff(
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    'returning from leave',
    '22222222-2222-4222-8222-222222222224'::uuid
  ) $$,
  'admin can reactivate staff in same location'
);

select is(
  (select p.is_active from public.profiles p where p.id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'),
  true,
  'reactivated staff profile is active again'
);

select throws_ok(
  $$ select public.admin_disable_staff(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'remove bootstrap admin',
    '22222222-2222-4222-8222-222222222226'::uuid
  ) $$,
  '42501',
  'cannot disable own account',
  'sole admin disable is blocked before last-admin removal'
);

select throws_ok(
  $$ select public.admin_update_staff_role(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'STAFF'::public.app_role,
    '22222222-2222-4222-8222-222222222227'::uuid
  ) $$,
  '42501',
  'cannot modify own role',
  'sole admin demotion is blocked before last-admin removal'
);

select throws_ok(
  $$ insert into public.profiles (
    id, parking_location_id, role, full_name, is_active
  ) values (
    '99999999-9999-4999-8999-999999999992',
    '11111111-1111-4111-8111-111111111111',
    'STAFF',
    'Direct Writer',
    true
  ) $$,
  '42501',
  null,
  'authenticated admin cannot insert profiles directly'
);

select throws_ok(
  $$ update public.staff_permissions
     set can_void_payments = true
     where profile_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' $$,
  '42501',
  null,
  'authenticated admin cannot update permissions directly'
);

select ok(
  (
    select count(*) >= 4
    from public.audit_logs
    where action like 'staff.%'
  ),
  'staff admin workflows append immutable audit evidence'
);

select * from finish();
rollback;
