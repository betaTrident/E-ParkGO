begin;

select plan(16);

select has_function('public', 'settle_cash_and_exit', array['uuid', 'bigint', 'text', 'uuid', 'uuid']);

reset role;

select throws_ok(
  $$ select public.settle_cash_and_exit(
    '11111111-1111-4111-8111-111111111111'::uuid,
    0,
    null,
    'f0f0f0f0-f0f0-4f0f-8f0f-f0f0f0f0f001'::uuid,
    'f0f0f0f0-f0f0-4f0f-8f0f-f0f0f0f0f002'::uuid
  ) $$,
  '42501',
  'authentication required',
  'unauthenticated settle denied'
);

set local role service_role;

-- Isolate pool before settle fixtures (prior files may leave active car sessions).
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

-- Zero-fee grace: settle directly from EXIT_PENDING without prior calculate
select isnt(
  (
    select (public.create_parking_entry(
      'SETTLE0',
      '33333333-3333-4333-8333-333333333331'::uuid,
      null,
      'f1f1f1f1-f1f1-4f1f-8f1f-f1f1f1f1f101'::uuid,
      'f1f1f1f1-f1f1-4f1f-8f1f-f1f1f1f1f102'::uuid
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
        where v.normalized_plate_number = 'SETTLE0'
        limit 1
      ),
      'f2f2f2f2-f2f2-4f2f-8f2f-f2f2f2f2f201'::uuid,
      'f2f2f2f2-f2f2-4f2f-8f2f-f2f2f2f2f202'::uuid
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
        where v.normalized_plate_number = 'SETTLE0'
        limit 1
      ),
      0,
      null,
      'f3f3f3f3-f3f3-4f3f-8f3f-f3f3f3f3f301'::uuid,
      'f3f3f3f3-f3f3-4f3f-8f3f-f3f3f3f3f302'::uuid
    )->>'session_status')
  ),
  'COMPLETED',
  'zero-fee settle+exit completes without payment row'
);

select cmp_ok(
  (
    select count(*)::integer
    from public.payments p
    join public.parking_sessions ps on ps.id = p.parking_session_id
    join public.vehicles v on v.id = ps.vehicle_id
    where v.normalized_plate_number = 'SETTLE0'
  ),
  '=',
  0,
  'zero-fee settle skips payment insert'
);

select is(
  (
    select ps.parking_space_id
    from public.parking_sessions ps
    join public.vehicles v on v.id = ps.vehicle_id
    where v.normalized_plate_number = 'SETTLE0'
    limit 1
  ),
  null,
  'pool entry remains unassigned after zero-fee settle'
);

-- Positive fee: settle with cash completes session
select isnt(
  (
    select (public.create_parking_entry(
      'SETTLE1',
      '33333333-3333-4333-8333-333333333331'::uuid,
      null,
      'f4f4f4f4-f4f4-4f4f-8f4f-f4f4f4f4f401'::uuid,
      'f4f4f4f4-f4f4-4f4f-8f4f-f4f4f4f4f402'::uuid
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
  and v.normalized_plate_number = 'SETTLE1';
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
        where v.normalized_plate_number = 'SETTLE1'
        limit 1
      ),
      'f5f5f5f5-f5f5-4f5f-8f5f-f5f5f5f5f501'::uuid,
      'f5f5f5f5-f5f5-4f5f-8f5f-f5f5f5f5f502'::uuid
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
        where v.normalized_plate_number = 'SETTLE1'
        limit 1
      ),
      10000,
      'REF-SETTLE1-001',
      'f6f6f6f6-f6f6-4f6f-8f6f-f6f6f6f6f601'::uuid,
      'f6f6f6f6-f6f6-4f6f-8f6f-f6f6f6f6f602'::uuid
    )->>'session_status')
  ),
  'COMPLETED',
  'positive fee settle with cash completes session'
);

select isnt(
  (
    select (public.settle_cash_and_exit(
      (
        select ps.id
        from public.parking_sessions ps
        join public.vehicles v on v.id = ps.vehicle_id
        where v.normalized_plate_number = 'SETTLE1'
        limit 1
      ),
      10000,
      'REF-SETTLE1-001',
      'f6f6f6f6-f6f6-4f6f-8f6f-f6f6f6f6f601'::uuid,
      'f6f6f6f6-f6f6-4f6f-8f6f-f6f6f6f6f602'::uuid
    )->>'session_status')
  ),
  null,
  'idempotent settle replay returns stored response'
);

-- Insufficient cash on a fresh paid fixture
select isnt(
  (
    select (public.create_parking_entry(
      'SETTLE2',
      '33333333-3333-4333-8333-333333333331'::uuid,
      null,
      'f7f7f7f7-f7f7-4f7f-8f7f-f7f7f7f7f701'::uuid,
      'f7f7f7f7-f7f7-4f7f-8f7f-f7f7f7f7f702'::uuid
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
  and v.normalized_plate_number = 'SETTLE2';
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
        where v.normalized_plate_number = 'SETTLE2'
        limit 1
      ),
      'f8f8f8f8-f8f8-4f8f-8f8f-f8f8f8f8f801'::uuid,
      'f8f8f8f8-f8f8-4f8f-8f8f-f8f8f8f8f802'::uuid
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
        where v.normalized_plate_number = 'SETTLE2'
        limit 1
      ),
      'fa0a0a0a-a0a0-4a0a-8a0a-a0a0a0a0a001'::uuid,
      'fa0a0a0a-a0a0-4a0a-8a0a-a0a0a0a0a002'::uuid
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
      where v.normalized_plate_number = 'SETTLE2'
      limit 1
    ),
    1000,
    null,
    'f9f9f9f9-f9f9-4f9f-8f9f-f9f9f9f9f901'::uuid,
    'f9f9f9f9-f9f9-4f9f-8f9f-f9f9f9f9f902'::uuid
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
    where v.normalized_plate_number = 'SETTLE2'
    limit 1
  ),
  'PAYMENT_PENDING',
  'insufficient cash leaves session payable not completed'
);

select * from finish();

rollback;
