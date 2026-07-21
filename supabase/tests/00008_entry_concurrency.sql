begin;

select plan(8);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}',
  true
);

-- Same-space race: first wins, second conflicts
select lives_ok(
  $$ select public.create_parking_entry(
    'RACE001',
    '33333333-3333-4333-8333-333333333331'::uuid,
    null,
    '44444444-4444-4444-8444-444444444442'::uuid,
    '21212121-2121-4212-8212-212121212101'::uuid,
    '22222222-2222-4222-8222-222222222201'::uuid
  ) $$,
  'first concurrent entry on space succeeds'
);

select throws_ok(
  $$ select public.create_parking_entry(
    'RACE002',
    '33333333-3333-4333-8333-333333333331'::uuid,
    null,
    '44444444-4444-4444-8444-444444444442'::uuid,
    '21212121-2121-4212-8212-212121212102'::uuid,
    '22222222-2222-4222-8222-222222222202'::uuid
  ) $$,
  'P0001',
  'SPACE_NOT_AVAILABLE',
  'second concurrent entry on same space rejected'
);

-- Same-plate race after first session active
select throws_ok(
  $$ select public.create_parking_entry(
    'RACE001',
    '33333333-3333-4333-8333-333333333332'::uuid,
    null,
    '44444444-4444-4444-8444-444444444443'::uuid,
    '23232323-2323-4323-8323-232323232301'::uuid,
    '24242424-2424-4424-8424-242424242401'::uuid
  ) $$,
  'P0001',
  'ACTIVE_SESSION_EXISTS',
  'same plate cannot occupy a second session'
);

-- Failed entry leaves no partial occupancy
select throws_ok(
  $$ select public.create_parking_entry(
    'FAIL001',
    '33333333-3333-4333-8333-333333333332'::uuid,
    null,
    '44444444-4444-4444-8444-444444444443'::uuid,
    '25252525-2525-4525-8525-252525252501'::uuid,
    '26262626-2626-4626-8626-262626262601'::uuid
  ) $$,
  'P0001',
  'RATE_NOT_CONFIGURED',
  'failed entry rolls back'
);

select is(
  (
    select count(*)::integer
    from public.parking_sessions
    where parking_location_id = '11111111-1111-4111-8111-111111111111'
      and status = 'ACTIVE'
      and id in (
        select ps.id
        from public.parking_sessions ps
        join public.vehicles v on v.id = ps.vehicle_id
        where v.normalized_plate_number = 'FAIL001'
      )
  ),
  0,
  'failed entry does not leave active session'
);

set local role service_role;

select is(
  (
    select count(*)::integer
    from public.idempotency_keys
    where operation = 'create_parking_entry'
      and key = '25252525-2525-4525-8525-252525252501'::uuid
      and status = 'COMPLETED'
  ),
  0,
  'failed entry does not persist completed idempotency record'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}',
  true
);

-- Exact replay after success returns same session id
select is(
  (
    select (public.create_parking_entry(
      'RACE001',
      '33333333-3333-4333-8333-333333333331'::uuid,
      null,
      '44444444-4444-4444-8444-444444444442'::uuid,
      '21212121-2121-4212-8212-212121212101'::uuid,
      '27272727-2727-4727-8727-272727272701'::uuid
    )->>'session_id')
  ),
  (
    select (public.create_parking_entry(
      'RACE001',
      '33333333-3333-4333-8333-333333333331'::uuid,
      null,
      '44444444-4444-4444-8444-444444444442'::uuid,
      '21212121-2121-4212-8212-212121212101'::uuid,
      '28282828-2828-4828-8828-282828282801'::uuid
    )->>'session_id')
  ),
  'exact idempotent replay returns same session id'
);

select ok(
  (
    select entry_time
    from public.parking_sessions
    where parking_space_id = '44444444-4444-4444-8444-444444444442'
      and status = 'ACTIVE'
    limit 1
  ) <= clock_timestamp(),
  'entry time uses authoritative database clock'
);

select * from finish();
rollback;
