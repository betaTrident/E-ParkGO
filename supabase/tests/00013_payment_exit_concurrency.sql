begin;

select plan(7);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}',
  true
);

select public.start_staff_shift(
  null,
  0,
  '31111111-1111-4111-8111-111111111101'::uuid,
  '31111111-1111-4111-8111-111111111102'::uuid
);

select isnt(
  (
    select (public.create_parking_entry(
      'PAYRACE1',
      '33333333-3333-4333-8333-333333333331'::uuid,
      null,
      '44444444-4444-4444-8444-444444444449'::uuid,
      '32121212-1212-4212-8212-121212121201'::uuid,
      '32121212-1212-4212-8212-121212121202'::uuid
    )->>'session_id')
  ),
  null,
  'concurrency fixture entry created'
);

set local role service_role;
update public.parking_sessions ps
set entry_time = ps.entry_time - interval '3 hours'
from public.vehicles v
where v.id = ps.vehicle_id
  and v.normalized_plate_number = 'PAYRACE1';
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}',
  true
);

select public.validate_parking_ticket(
  null,
  (
    select pt.ticket_number::text
    from public.parking_tickets pt
    join public.parking_sessions ps on ps.id = pt.parking_session_id
    join public.vehicles v on v.id = ps.vehicle_id
    where v.normalized_plate_number = 'PAYRACE1'
    limit 1
  ),
  '33131313-1313-4313-8313-131313131301'::uuid,
  '33131313-1313-4313-8313-131313131302'::uuid
);

select public.calculate_parking_exit(
  (
    select ps.id
    from public.parking_sessions ps
    join public.vehicles v on v.id = ps.vehicle_id
    where v.normalized_plate_number = 'PAYRACE1'
    limit 1
  ),
  '34141414-1414-4414-8414-141414141401'::uuid,
  '34141414-1414-4414-8414-141414141402'::uuid
);

select is(
  (
    select (public.record_parking_payment(
      (
        select ps.id
        from public.parking_sessions ps
        join public.vehicles v on v.id = ps.vehicle_id
        where v.normalized_plate_number = 'PAYRACE1'
        limit 1
      ),
      10000,
      null,
      '35151515-1515-4515-8515-151515151501'::uuid,
      '35151515-1515-4515-8515-151515151502'::uuid
    )->>'payment_id')
  ),
  (
    select (public.record_parking_payment(
      (
        select ps.id
        from public.parking_sessions ps
        join public.vehicles v on v.id = ps.vehicle_id
        where v.normalized_plate_number = 'PAYRACE1'
        limit 1
      ),
      10000,
      null,
      '35151515-1515-4515-8515-151515151501'::uuid,
      '35151515-1515-4515-8515-151515151503'::uuid
    )->>'payment_id')
  ),
  'payment idempotency replay returns original payment'
);

select cmp_ok(
  (
    select count(*)::integer
    from public.payments p
    join public.parking_sessions ps on ps.id = p.parking_session_id
    join public.vehicles v on v.id = ps.vehicle_id
    where v.normalized_plate_number = 'PAYRACE1'
  ),
  '=',
  1,
  'idempotent payment retry does not duplicate'
);

select throws_ok(
  $$ select public.record_parking_payment(
    (
      select ps.id
      from public.parking_sessions ps
      join public.vehicles v on v.id = ps.vehicle_id
      where v.normalized_plate_number = 'PAYRACE1'
      limit 1
    ),
    20000,
    null,
    '36161616-1616-4616-8616-161616161601'::uuid,
    '36161616-1616-4616-8616-161616161602'::uuid
  ) $$,
  'P0001',
  'PAYMENT_ALREADY_RECORDED',
  'changed payment payload with new key rejected'
);

select is(
  (
    select (public.confirm_vehicle_exit(
      (
        select ps.id
        from public.parking_sessions ps
        join public.vehicles v on v.id = ps.vehicle_id
        where v.normalized_plate_number = 'PAYRACE1'
        limit 1
      ),
      '37171717-1717-4717-8717-171717171701'::uuid,
      '37171717-1717-4717-8717-171717171702'::uuid
    )->>'status')
  ),
  'COMPLETED',
  'first exit confirmation succeeds'
);

select is(
  (
    select (public.confirm_vehicle_exit(
      (
        select ps.id
        from public.parking_sessions ps
        join public.vehicles v on v.id = ps.vehicle_id
        where v.normalized_plate_number = 'PAYRACE1'
        limit 1
      ),
      '37171717-1717-4717-8717-171717171701'::uuid,
      '37171717-1717-4717-8717-171717171703'::uuid
    )->>'status')
  ),
  'COMPLETED',
  'exit idempotency replay returns original completion'
);

set local role service_role;
select cmp_ok(
  (
    select count(*)::integer
    from public.audit_logs al
    where al.action = 'VEHICLE_EXIT_CONFIRMED'
      and al.target_id = (
        select ps.id
        from public.parking_sessions ps
        join public.vehicles v on v.id = ps.vehicle_id
        where v.normalized_plate_number = 'PAYRACE1'
        limit 1
      )
  ),
  '=',
  1,
  'exit confirmation audited once'
);
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}',
  true
);

select * from finish();

rollback;
