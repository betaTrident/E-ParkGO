begin;

select plan(27);

select has_function(
  'public',
  'create_parking_entry',
  array['text', 'uuid', 'text', 'uuid', 'uuid']
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

-- 1. Capacity entry (plate+type, null space) succeeds under available pool
select isnt(
  (
    select (public.create_parking_entry(
      'S6CAP001',
      '33333333-3333-4333-8333-333333333331'::uuid,
      null,
      '56010101-0101-4010-8010-010101010101'::uuid,
      '56010101-0101-4010-8010-010101010102'::uuid
    )->>'session_id')
  ),
  null,
  'capacity entry without space succeeds when car pool has capacity'
);

select is(
  (
    select ps.parking_space_id
    from public.parking_sessions ps
    join public.vehicles v on v.id = ps.vehicle_id
    where v.normalized_plate_number = 'S6CAP001'
      and ps.status = 'ACTIVE'
  ),
  null,
  'pool entry stores null parking_space_id'
);

-- 2. CAPACITY_FULL when car pool exhausted
select lives_ok(
  $$ select public.create_parking_entry(
    'S6CAP002',
    '33333333-3333-4333-8333-333333333331'::uuid,
    null,
    '56020202-0202-4020-8020-020202020201'::uuid,
    '56020202-0202-4020-8020-020202020202'::uuid
  ) $$,
  'second car entry fills reduced car pool'
);

select throws_ok(
  $$ select public.create_parking_entry(
    'S6CAP003',
    '33333333-3333-4333-8333-333333333331'::uuid,
    null,
    '56030303-0303-4030-8030-030303030301'::uuid,
    '56030303-0303-4030-8030-030303030302'::uuid
  ) $$,
  'P0001',
  'CAPACITY_FULL',
  'car pool full rejects additional entry'
);

-- 3. Motorcycle pool independent of car
select lives_ok(
  $$ select public.create_parking_entry(
    'S6MOTO01',
    '33333333-3333-4333-8333-333333333332'::uuid,
    null,
    '56040404-0404-4040-8040-040404040401'::uuid,
    '56040404-0404-4040-8040-040404040402'::uuid
  ) $$,
  'motorcycle entry succeeds while car pool is full'
);

select throws_ok(
  $$ select public.create_parking_entry(
    'S6MOTO02',
    '33333333-3333-4333-8333-333333333332'::uuid,
    null,
    '56050505-0505-4050-8050-050505050501'::uuid,
    '56050505-0505-4050-8050-050505050502'::uuid
  ) $$,
  'P0001',
  'CAPACITY_FULL',
  'motorcycle pool full rejects additional entry'
);

-- Free capacity pools for settle and permission fixtures.
set local role service_role;

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

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}',
  true
);

-- 4. Zero-fee settle path completes session
select isnt(
  (
    select (public.create_parking_entry(
      'S6SETTLE0',
      '33333333-3333-4333-8333-333333333331'::uuid,
      null,
      '56060606-0606-4060-8060-060606060601'::uuid,
      '56060606-0606-4060-8060-060606060602'::uuid
    )->>'session_id')
  ),
  null,
  'zero-fee settle fixture entry created'
);

select is(
  (
    select (public.validate_parking_ticket(
      null,
      (
        select pt.ticket_number::text
        from public.parking_tickets pt
        join public.parking_sessions ps on ps.id = pt.parking_session_id
        join public.vehicles v on v.id = ps.vehicle_id
        where v.normalized_plate_number = 'S6SETTLE0'
        limit 1
      ),
      '56070707-0707-4070-8070-070707070701'::uuid,
      '56070707-0707-4070-8070-070707070702'::uuid
    )->>'status')
  ),
  'EXIT_PENDING',
  'zero-fee fixture validated'
);

select is(
  (
    select (public.settle_cash_and_exit(
      (
        select ps.id
        from public.parking_sessions ps
        join public.vehicles v on v.id = ps.vehicle_id
        where v.normalized_plate_number = 'S6SETTLE0'
        limit 1
      ),
      0::bigint,
      null::text,
      '56080808-0808-4080-8080-080808080801'::uuid,
      '56080808-0808-4080-8080-080808080802'::uuid
    )->>'session_status')
  ),
  'COMPLETED',
  'zero-fee settle completes session'
);

-- 5. Paid settle with cash completes session and attributes payment to actor
select isnt(
  (
    select (public.create_parking_entry(
      'S6SETTLE1',
      '33333333-3333-4333-8333-333333333331'::uuid,
      null,
      '56090909-0909-4090-8090-090909090901'::uuid,
      '56090909-0909-4090-8090-090909090902'::uuid
    )->>'session_id')
  ),
  null,
  'paid settle fixture entry created'
);

set local role service_role;
update public.parking_sessions ps
set entry_time = ps.entry_time - interval '3 hours'
from public.vehicles v
where v.id = ps.vehicle_id
  and v.normalized_plate_number = 'S6SETTLE1';
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}',
  true
);

select is(
  (
    select (public.validate_parking_ticket(
      null,
      (
        select pt.ticket_number::text
        from public.parking_tickets pt
        join public.parking_sessions ps on ps.id = pt.parking_session_id
        join public.vehicles v on v.id = ps.vehicle_id
        where v.normalized_plate_number = 'S6SETTLE1'
        limit 1
      ),
      '560a0a0a-a0a0-40a0-80a0-a0a0a0a0a001'::uuid,
      '560a0a0a-a0a0-40a0-80a0-a0a0a0a0a002'::uuid
    )->>'status')
  ),
  'EXIT_PENDING',
  'paid settle fixture validated'
);

select is(
  (
    select (public.settle_cash_and_exit(
      (
        select ps.id
        from public.parking_sessions ps
        join public.vehicles v on v.id = ps.vehicle_id
        where v.normalized_plate_number = 'S6SETTLE1'
        limit 1
      ),
      10000,
      'REF-S6SETTLE1-001',
      '560b0b0b-b0b0-40b0-80b0-b0b0b0b0b001'::uuid,
      '560b0b0b-b0b0-40b0-80b0-b0b0b0b0b002'::uuid
    )->>'session_status')
  ),
  'COMPLETED',
  'paid settle with cash completes session'
);

set local role service_role;
select is(
  (
    select p.staff_shift_id
    from public.payments p
    join public.parking_sessions ps on ps.id = p.parking_session_id
    join public.vehicles v on v.id = ps.vehicle_id
    where v.normalized_plate_number = 'S6SETTLE1'
    limit 1
  ),
  null,
  'settle payment stores null staff_shift_id'
);

select is(
  (
    select p.processed_by::text
    from public.payments p
    join public.parking_sessions ps on ps.id = p.parking_session_id
    join public.vehicles v on v.id = ps.vehicle_id
    where v.normalized_plate_number = 'S6SETTLE1'
    limit 1
  ),
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  'settle payment processed_by matches staff actor'
);
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}',
  true
);

-- 6. Insufficient cash does not complete session
select isnt(
  (
    select (public.create_parking_entry(
      'S6SETTLE2',
      '33333333-3333-4333-8333-333333333331'::uuid,
      null,
      '560c0c0c-c0c0-40c0-80c0-c0c0c0c0c001'::uuid,
      '560c0c0c-c0c0-40c0-80c0-c0c0c0c0c002'::uuid
    )->>'session_id')
  ),
  null,
  'insufficient-cash fixture entry created'
);

set local role service_role;
update public.parking_sessions ps
set entry_time = ps.entry_time - interval '3 hours'
from public.vehicles v
where v.id = ps.vehicle_id
  and v.normalized_plate_number = 'S6SETTLE2';
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}',
  true
);

select is(
  (
    select (public.validate_parking_ticket(
      null,
      (
        select pt.ticket_number::text
        from public.parking_tickets pt
        join public.parking_sessions ps on ps.id = pt.parking_session_id
        join public.vehicles v on v.id = ps.vehicle_id
        where v.normalized_plate_number = 'S6SETTLE2'
        limit 1
      ),
      '560d0d0d-d0d0-40d0-80d0-d0d0d0d0d001'::uuid,
      '560d0d0d-d0d0-40d0-80d0-d0d0d0d0d002'::uuid
    )->>'status')
  ),
  'EXIT_PENDING',
  'insufficient-cash fixture validated'
);

select is(
  (
    select (public.calculate_parking_exit(
      (
        select ps.id
        from public.parking_sessions ps
        join public.vehicles v on v.id = ps.vehicle_id
        where v.normalized_plate_number = 'S6SETTLE2'
        limit 1
      ),
      '560d1d1d-d1d1-40d1-80d1-d1d1d1d1d101'::uuid,
      '560d1d1d-d1d1-40d1-80d1-d1d1d1d1d102'::uuid
    )->>'status')
  ),
  'PAYMENT_PENDING',
  'insufficient-cash fixture quoted before settle attempt'
);

select throws_ok(
  $$ select public.settle_cash_and_exit(
    (
      select ps.id
      from public.parking_sessions ps
      join public.vehicles v on v.id = ps.vehicle_id
      where v.normalized_plate_number = 'S6SETTLE2'
      limit 1
    ),
    1000,
    null::text,
    '560e0e0e-e0e0-40e0-80e0-e0e0e0e0e001'::uuid,
    '560e0e0e-e0e0-40e0-80e0-e0e0e0e0e002'::uuid
  ) $$,
  'P0001',
  'INSUFFICIENT_CASH',
  'insufficient cash fails without completing'
);

select is(
  (
    select ps.status::text
    from public.parking_sessions ps
    join public.vehicles v on v.id = ps.vehicle_id
    where v.normalized_plate_number = 'S6SETTLE2'
    limit 1
  ),
  'PAYMENT_PENDING',
  'insufficient cash leaves session payable not completed'
);

-- 7. Idempotent settle replay returns same result
select is(
  (
    select (public.settle_cash_and_exit(
      (
        select ps.id
        from public.parking_sessions ps
        join public.vehicles v on v.id = ps.vehicle_id
        where v.normalized_plate_number = 'S6SETTLE1'
        limit 1
      ),
      10000,
      'REF-S6SETTLE1-001',
      '560b0b0b-b0b0-40b0-80b0-b0b0b0b0b001'::uuid,
      '560b0b0b-b0b0-40b0-80b0-b0b0b0b0b002'::uuid
    )->>'session_status')
  ),
  'COMPLETED',
  'idempotent settle replay returns stored response'
);

-- Free capacity pools before permission fixtures.
set local role service_role;

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

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}',
  true
);

-- 8. Lost ticket requires permission (staff seed lacks can_process_lost_tickets)
select isnt(
  (
    select (public.create_parking_entry(
      'S6LOST01',
      '33333333-3333-4333-8333-333333333331'::uuid,
      null,
      '560f0f0f-f0f0-40f0-80f0-f0f0f0f0f001'::uuid,
      '560f0f0f-f0f0-40f0-80f0-f0f0f0f0f002'::uuid
    )->>'session_id')
  ),
  null,
  'lost ticket permission fixture entry created'
);

select throws_ok(
  $$ select public.process_lost_ticket(
    (
      select ps.id
      from public.parking_sessions ps
      join public.vehicles v on v.id = ps.vehicle_id
      where v.normalized_plate_number = 'S6LOST01'
      limit 1
    ),
    jsonb_build_object('plate_photo', 'hash-only-evidence'),
    'Staff attempted lost ticket without permission.',
    '56101010-1010-4101-8101-010101010101'::uuid,
    '56101010-1010-4101-8101-010101010102'::uuid
  ) $$,
  'P0001',
  'INSUFFICIENT_PERMISSION',
  'staff without lost-ticket permission denied'
);

-- 9. Cancel eligible session permission gate + permitted admin path
select isnt(
  (
    select (public.create_parking_entry(
      'S6CANCEL1',
      '33333333-3333-4333-8333-333333333331'::uuid,
      null,
      '56111111-1111-4111-8111-111111111101'::uuid,
      '56111111-1111-4111-8111-111111111102'::uuid
    )->>'session_id')
  ),
  null,
  'cancel permission fixture entry created'
);

select throws_ok(
  $$ select public.cancel_parking_session(
    (
      select ps.id
      from public.parking_sessions ps
      join public.vehicles v on v.id = ps.vehicle_id
      where v.normalized_plate_number = 'S6CANCEL1'
      limit 1
    ),
    'Staff requested cancellation without permission.',
    '56121212-1212-4121-8121-121212121201'::uuid,
    '56121212-1212-4121-8121-121212121202'::uuid
  ) $$,
  'P0001',
  'INSUFFICIENT_PERMISSION',
  'staff without cancel permission denied'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}',
  true
);

select is(
  (
    select (public.cancel_parking_session(
      (
        select ps.id
        from public.parking_sessions ps
        join public.vehicles v on v.id = ps.vehicle_id
        where v.normalized_plate_number = 'S6CANCEL1'
        limit 1
      ),
      'Admin approved cancellation for S6 regression matrix.',
      '56131313-1313-4131-8131-131313131301'::uuid,
      '56131313-1313-4131-8131-131313131302'::uuid
    )->>'status')
  ),
  'CANCELLED',
  'permitted admin cancellation completes'
);

-- 10. create_parking_entry idempotency hash excludes space_id (5-arg contract only)
reset role;
select is(
  (
    select ik.request_hash
    from public.idempotency_keys ik
    where ik.operation = 'create_parking_entry'
      and ik.key = '56010101-0101-4010-8010-010101010101'::uuid
  ),
  private.hash_idempotency_request(
    jsonb_build_object(
      'plate', 'S6CAP001',
      'vehicle_type_id', '33333333-3333-4333-8333-333333333331',
      'color', null
    )
  ),
  'create_parking_entry request hash excludes space_id'
);

select * from finish();
rollback;
