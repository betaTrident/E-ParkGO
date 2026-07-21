begin;

select plan(25);

select has_function('public', 'start_staff_shift', array['uuid', 'bigint', 'uuid', 'uuid']);
select has_function('public', 'close_staff_shift', array['uuid', 'bigint', 'text', 'uuid', 'uuid']);
select has_function('public', 'record_parking_payment', array['uuid', 'bigint', 'text', 'uuid', 'uuid']);
select has_function('public', 'confirm_vehicle_exit', array['uuid', 'uuid', 'uuid']);

reset role;

select throws_ok(
  $$ select public.start_staff_shift(
    null,
    0,
    '21111111-1111-4111-8111-111111111101'::uuid,
    '21111111-1111-4111-8111-111111111102'::uuid
  ) $$,
  '42501',
  'authentication required',
  'unauthenticated shift start denied'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}',
  true
);

select isnt(
  (
    select (public.start_staff_shift(
      null,
      5000,
      '22111111-1111-4111-8111-111111111101'::uuid,
      '22111111-1111-4111-8111-111111111102'::uuid
    )->>'shift_id')
  ),
  null,
  'staff can open a shift'
);

select throws_ok(
  $$ select public.start_staff_shift(
    null,
    0,
    '23111111-1111-4111-8111-111111111101'::uuid,
    '23111111-1111-4111-8111-111111111102'::uuid
  ) $$,
  'P0001',
  'INVALID_STATUS_TRANSITION',
  'duplicate open shift rejected'
);

select isnt(
  (
    select (public.create_parking_entry(
      'PAYEXIT1',
      '33333333-3333-4333-8333-333333333331'::uuid,
      null,
      '44444444-4444-4444-8444-444444444447'::uuid,
      '24141414-1414-4414-8414-141414141401'::uuid,
      '24141414-1414-4414-8414-141414141402'::uuid
    )->>'session_id')
  ),
  null,
  'payment fixture entry created'
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
        where v.normalized_plate_number = 'PAYEXIT1'
        limit 1
      ),
      '25151515-1515-4515-8515-151515151501'::uuid,
      '25151515-1515-4515-8515-151515151502'::uuid
    )->>'status')
  ),
  'EXIT_PENDING',
  'validation prepares payment fixture'
);

select is(
  (
    select (public.calculate_parking_exit(
      (
        select ps.id
        from public.parking_sessions ps
        join public.vehicles v on v.id = ps.vehicle_id
        where v.normalized_plate_number = 'PAYEXIT1'
        limit 1
      ),
      '26161616-1616-4616-8616-161616161601'::uuid,
      '26161616-1616-4616-8616-161616161602'::uuid
    )->>'status')
  ),
  'PAID_AWAITING_EXIT',
  'grace-period session needs no cash collection'
);

select throws_ok(
  $$ select public.record_parking_payment(
    (
      select ps.id
      from public.parking_sessions ps
      join public.vehicles v on v.id = ps.vehicle_id
      where v.normalized_plate_number = 'PAYEXIT1'
      limit 1
    ),
    0,
    null,
    '27171717-1717-4717-8717-171717171701'::uuid,
    '27171717-1717-4717-8717-171717171702'::uuid
  ) $$,
  'P0001',
  'PAYMENT_ALREADY_RECORDED',
  'zero-fee session rejects redundant payment'
);

select is(
  (
    select (public.confirm_vehicle_exit(
      (
        select ps.id
        from public.parking_sessions ps
        join public.vehicles v on v.id = ps.vehicle_id
        where v.normalized_plate_number = 'PAYEXIT1'
        limit 1
      ),
      '28181818-1818-4818-8818-181818181801'::uuid,
      '28181818-1818-4818-8818-181818181802'::uuid
    )->>'status')
  ),
  'COMPLETED',
  'zero-fee paid-awaiting exit completes'
);

select is(
  (
    select ps.status::text
    from public.parking_sessions ps
    join public.vehicles v on v.id = ps.vehicle_id
    where v.normalized_plate_number = 'PAYEXIT1'
    limit 1
  ),
  'COMPLETED',
  'session persisted as completed'
);

select is(
  (
    select sp.status::text
    from public.parking_spaces sp
    where sp.id = '44444444-4444-4444-8444-444444444447'
  ),
  'AVAILABLE',
  'space released after exit'
);

select isnt(
  (
    select (public.create_parking_entry(
      'PAYEXIT2',
      '33333333-3333-4333-8333-333333333331'::uuid,
      null,
      '44444444-4444-4444-8444-444444444448'::uuid,
      '29191919-1919-4919-8919-191919191901'::uuid,
      '29191919-1919-4919-8919-191919191902'::uuid
    )->>'session_id')
  ),
  null,
  'paid fixture entry created'
);

set local role service_role;
update public.parking_sessions ps
set entry_time = ps.entry_time - interval '3 hours'
from public.vehicles v
where v.id = ps.vehicle_id
  and v.normalized_plate_number = 'PAYEXIT2';
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
        where v.normalized_plate_number = 'PAYEXIT2'
        limit 1
      ),
      '2a1a1a1a-1a1a-4a1a-8a1a-1a1a1a1a1a01'::uuid,
      '2a1a1a1a-1a1a-4a1a-8a1a-1a1a1a1a1a02'::uuid
    )->>'status')
  ),
  'EXIT_PENDING',
  'paid fixture validated'
);

select is(
  (
    select (public.calculate_parking_exit(
      (
        select ps.id
        from public.parking_sessions ps
        join public.vehicles v on v.id = ps.vehicle_id
        where v.normalized_plate_number = 'PAYEXIT2'
        limit 1
      ),
      '2b2b2b2b-2b2b-4b2b-8b2b-2b2b2b2b2b01'::uuid,
      '2b2b2b2b-2b2b-4b2b-8b2b-2b2b2b2b2b02'::uuid
    )->>'status')
  ),
  'PAYMENT_PENDING',
  'paid fixture reaches payment pending'
);

select throws_ok(
  $$ select public.record_parking_payment(
    (
      select ps.id
      from public.parking_sessions ps
      join public.vehicles v on v.id = ps.vehicle_id
      where v.normalized_plate_number = 'PAYEXIT2'
      limit 1
    ),
    1000,
    null,
    '2c2c2c2c-2c2c-4c2c-8c2c-2c2c2c2c2c01'::uuid,
    '2c2c2c2c-2c2c-4c2c-8c2c-2c2c2c2c2c02'::uuid
  ) $$,
  'P0001',
  'INSUFFICIENT_CASH',
  'insufficient cash rejected'
);

select is(
  (
    select (public.record_parking_payment(
      (
        select ps.id
        from public.parking_sessions ps
        join public.vehicles v on v.id = ps.vehicle_id
        where v.normalized_plate_number = 'PAYEXIT2'
        limit 1
      ),
      10000,
      'REF-PAYEXIT2-001',
      '2d2d2d2d-2d2d-4d2d-8d2d-2d2d2d2d2d01'::uuid,
      '2d2d2d2d-2d2d-4d2d-8d2d-2d2d2d2d2d02'::uuid
    )->>'session_status')
  ),
  'PAID_AWAITING_EXIT',
  'exact cash payment recorded'
);

select cmp_ok(
  (
    select count(*)::integer
    from public.payments p
    join public.parking_sessions ps on ps.id = p.parking_session_id
    join public.vehicles v on v.id = ps.vehicle_id
    where v.normalized_plate_number = 'PAYEXIT2'
  ),
  '=',
  1,
  'one payment row appended'
);

select cmp_ok(
  (
    select count(*)::integer
    from public.receipts r
    join public.payments p on p.id = r.payment_id
    join public.parking_sessions ps on ps.id = p.parking_session_id
    join public.vehicles v on v.id = ps.vehicle_id
    where v.normalized_plate_number = 'PAYEXIT2'
  ),
  '=',
  1,
  'receipt metadata appended'
);

select is(
  (
    select sp.status::text
    from public.parking_spaces sp
    where sp.id = '44444444-4444-4444-8444-444444444448'
  ),
  'OCCUPIED',
  'payment does not release space'
);

select is(
  (
    select (public.confirm_vehicle_exit(
      (
        select ps.id
        from public.parking_sessions ps
        join public.vehicles v on v.id = ps.vehicle_id
        where v.normalized_plate_number = 'PAYEXIT2'
        limit 1
      ),
      '2e2e2e2e-2e2e-4e2e-8e2e-2e2e2e2e2e01'::uuid,
      '2e2e2e2e-2e2e-4e2e-8e2e-2e2e2e2e2e02'::uuid
    )->>'status')
  ),
  'COMPLETED',
  'paid exit confirmed once'
);

select is(
  (
    select (public.close_staff_shift(
      (
        select ss.id
        from public.staff_shifts ss
        where ss.profile_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
          and ss.status = 'OPEN'
        order by ss.opened_at desc
        limit 1
      ),
      20000,
      'End of shift test',
      '2f2f2f2f-2f2f-4f2f-8f2f-2f2f2f2f2f01'::uuid,
      '2f2f2f2f-2f2f-4f2f-8f2f-2f2f2f2f2f02'::uuid
    )->>'status')
  ),
  'CLOSED',
  'shift closes with variance capture'
);

select ok(
  (
    select ss.variance_centavos is not null
    from public.staff_shifts ss
    where ss.profile_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
    order by ss.opened_at desc
    limit 1
  ),
  'shift variance persisted'
);

select * from finish();

rollback;
