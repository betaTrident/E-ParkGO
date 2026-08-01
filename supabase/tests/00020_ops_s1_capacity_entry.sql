begin;

select plan(13);

select has_function(
  'public',
  'create_parking_entry',
  array['text', 'uuid', 'text', 'uuid', 'uuid']
);

select has_function(
  'public',
  'admin_update_location_capacities',
  array['integer', 'integer']
);

set local role service_role;

-- Isolate pool: complete leftover nonterminal sessions from prior test files or seed.
update public.parking_sessions ps
set
  status = 'COMPLETED',
  exit_time = coalesce(ps.exit_time, clock_timestamp()),
  updated_at = now()
where ps.parking_location_id = '11111111-1111-4111-8111-111111111111'
  and ps.status in (
    'ACTIVE',
    'EXIT_PENDING',
    'PAYMENT_PENDING',
    'PAID_AWAITING_EXIT',
    'LOST_TICKET',
    'MANUAL_REVIEW'
  );

update public.parking_locations pl
set
  car_capacity = 2,
  motorcycle_capacity = 1,
  updated_at = now()
where pl.id = '11111111-1111-4111-8111-111111111111';

insert into public.parking_rates (
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
values (
  '56565656-5656-4656-8656-565656565651',
  '11111111-1111-4111-8111-111111111111',
  '33333333-3333-4333-8333-333333333332',
  1,
  'FLAT',
  15,
  3000,
  0,
  10000,
  '2026-01-01T00:00:00+08:00'::timestamptz,
  true,
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
)
on conflict (id) do nothing;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}',
  true
);

-- 1. Entry without space succeeds when capacity available
select isnt(
  (
    select (public.create_parking_entry(
      'CAP001',
      '33333333-3333-4333-8333-333333333331'::uuid,
      null,
      'a0a0a0a0-a0a0-4a0a-8a0a-a0a0a0a0a001'::uuid,
      'b0b0b0b0-b0b0-4b0b-8b0b-b0b0b0b0b001'::uuid
    )->>'session_id')
  ),
  null,
  'entry without space succeeds when car pool has capacity'
);

select is(
  (
    select ps.parking_space_id
    from public.parking_sessions ps
    join public.vehicles v on v.id = ps.vehicle_id
    where v.normalized_plate_number = 'CAP001'
      and ps.status = 'ACTIVE'
  ),
  null,
  'pool entry stores null parking_space_id'
);

-- 2. Filling capacity then next entry returns CAPACITY_FULL
select lives_ok(
  $$ select public.create_parking_entry(
    'CAP002',
    '33333333-3333-4333-8333-333333333331'::uuid,
    null,
    'a0a0a0a0-a0a0-4a0a-8a0a-a0a0a0a0a002'::uuid,
    'b0b0b0b0-b0b0-4b0b-8b0b-b0b0b0b0b002'::uuid
  ) $$,
  'second car entry fills reduced car pool'
);

select throws_ok(
  $$ select public.create_parking_entry(
    'CAP003',
    '33333333-3333-4333-8333-333333333331'::uuid,
    null,
    'a0a0a0a0-a0a0-4a0a-8a0a-a0a0a0a0a003'::uuid,
    'b0b0b0b0-b0b0-4b0b-8b0b-b0b0b0b0b003'::uuid
  ) $$,
  'P0001',
  'CAPACITY_FULL',
  'car pool full rejects additional entry'
);

-- 3. Motorcycle and car pools are independent
select lives_ok(
  $$ select public.create_parking_entry(
    'MOTO001',
    '33333333-3333-4333-8333-333333333332'::uuid,
    null,
    'c0c0c0c0-c0c0-4c0c-8c0c-c0c0c0c0c001'::uuid,
    'd0d0d0d0-d0d0-4d0d-8d0d-d0d0d0d0d001'::uuid
  ) $$,
  'motorcycle entry succeeds while car pool is full'
);

select throws_ok(
  $$ select public.create_parking_entry(
    'MOTO002',
    '33333333-3333-4333-8333-333333333332'::uuid,
    null,
    'c0c0c0c0-c0c0-4c0c-8c0c-c0c0c0c0c002'::uuid,
    'd0d0d0d0-d0d0-4d0d-8d0d-d0d0d0d0d002'::uuid
  ) $$,
  'P0001',
  'CAPACITY_FULL',
  'motorcycle pool full rejects additional entry after capacity reached'
);

-- 4. Idempotent replay still works
select lives_ok(
  $$ select public.create_parking_entry(
    'CAP001',
    '33333333-3333-4333-8333-333333333331'::uuid,
    null,
    'a0a0a0a0-a0a0-4a0a-8a0a-a0a0a0a0a001'::uuid,
    'b0b0b0b0-b0b0-4b0b-8b0b-b0b0b0b0b099'::uuid
  ) $$,
  'idempotent replay succeeds for pool entry'
);

select is(
  (
    select (public.create_parking_entry(
      'CAP001',
      '33333333-3333-4333-8333-333333333331'::uuid,
      null,
      'a0a0a0a0-a0a0-4a0a-8a0a-a0a0a0a0a001'::uuid,
      'b0b0b0b0-b0b0-4b0b-8b0b-b0b0b0b0b099'::uuid
    )->>'credential_recovery')
  ),
  'REISSUE_REQUIRED',
  'idempotent replay omits token and requires reissue'
);

select is(
  (
    select (public.create_parking_entry(
      'CAP001',
      '33333333-3333-4333-8333-333333333331'::uuid,
      null,
      'a0a0a0a0-a0a0-4a0a-8a0a-a0a0a0a0a001'::uuid,
      'b0b0b0b0-b0b0-4b0b-8b0b-b0b0b0b0b099'::uuid
    )->>'qr_payload')
  ),
  null,
  'idempotent replay never returns qr payload'
);

select ok(
  (
    select (public.get_dashboard_snapshot()->'metrics'->>'car_capacity')::int = 2
      and (public.get_dashboard_snapshot()->'metrics'->>'motorcycle_capacity')::int = 1
  ),
  'dashboard snapshot exposes pool capacity metrics'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}',
  true
);

select lives_ok(
  $$ select public.admin_update_location_capacities(50, 30) $$,
  'admin can update location capacities'
);

select * from finish();
rollback;
