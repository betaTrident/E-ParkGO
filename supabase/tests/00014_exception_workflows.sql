begin;

select plan(11);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}',
  true
);

select public.start_staff_shift(
  null,
  0,
  '41111111-1111-4111-8111-111111111101'::uuid,
  '41111111-1111-4111-8111-111111111102'::uuid
);

select isnt(
  (
    select (public.create_parking_entry(
      'EXCANCEL1',
      '33333333-3333-4333-8333-333333333331'::uuid,
      null,
      '44444444-4444-4444-8444-444444444441'::uuid,
      '42121212-1212-4212-8212-121212121201'::uuid,
      '42121212-1212-4212-8212-121212121202'::uuid
    )->>'session_id')
  ),
  null,
  'cancellation fixture entry created'
);

select throws_ok(
  $$ select public.cancel_parking_session(
    (
      select ps.id
      from public.parking_sessions ps
      join public.vehicles v on v.id = ps.vehicle_id
      where v.normalized_plate_number = 'EXCANCEL1'
      limit 1
    ),
    'Staff requested cancellation for test fixture.',
    '43131313-1313-4313-8313-131313131301'::uuid,
    '43131313-1313-4313-8313-131313131302'::uuid
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
        where v.normalized_plate_number = 'EXCANCEL1'
        limit 1
      ),
      'Admin approved cancellation for test fixture.',
      '44141414-1414-4414-8414-141414141401'::uuid,
      '44141414-1414-4414-8414-141414141402'::uuid
    )->>'status')
  ),
  'CANCELLED',
  'permitted cancellation completes'
);

select isnt(
  (
    select (public.create_parking_entry(
      'EXLOST01',
      '33333333-3333-4333-8333-333333333331'::uuid,
      null,
      '44444444-4444-4444-8444-444444444442'::uuid,
      '45151515-1515-4515-8515-151515151501'::uuid,
      '45151515-1515-4515-8515-151515151502'::uuid
    )->>'session_id')
  ),
  null,
  'lost ticket fixture entry created'
);

select throws_ok(
  $$ select public.process_lost_ticket(
    (
      select ps.id
      from public.parking_sessions ps
      join public.vehicles v on v.id = ps.vehicle_id
      where v.normalized_plate_number = 'EXLOST01'
      limit 1
    ),
    '{}'::jsonb,
    'Lost ticket reason for test fixture.',
    '46161616-1616-4616-8616-161616161601'::uuid,
    '46161616-1616-4616-8616-161616161602'::uuid
  ) $$,
  '22023',
  null,
  'lost ticket without evidence rejected'
);

select is(
  (
    select (public.process_lost_ticket(
      (
        select ps.id
        from public.parking_sessions ps
        join public.vehicles v on v.id = ps.vehicle_id
        where v.normalized_plate_number = 'EXLOST01'
        limit 1
      ),
      jsonb_build_object('plate_photo', 'hash-only-evidence'),
      'Lost ticket approved with vehicle evidence.',
      '47171717-1717-4717-8717-171717171701'::uuid,
      '47171717-1717-4717-8717-171717171702'::uuid
    )->>'status')
  ),
  'LOST_TICKET',
  'lost ticket workflow records state'
);

select isnt(
  (
    select (public.create_parking_entry(
      'EXVOID01',
      '33333333-3333-4333-8333-333333333331'::uuid,
      null,
      '44444444-4444-4444-8444-444444444444'::uuid,
      '48181818-1818-4818-8818-181818181801'::uuid,
      '48181818-1818-4818-8818-181818181802'::uuid
    )->>'session_id')
  ),
  null,
  'void fixture entry created'
);

set local role service_role;
update public.parking_sessions ps
set entry_time = ps.entry_time - interval '3 hours'
from public.vehicles v
where v.id = ps.vehicle_id
  and v.normalized_plate_number = 'EXVOID01';
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
    where v.normalized_plate_number = 'EXVOID01'
    limit 1
  ),
  '49191919-1919-4919-8919-191919191901'::uuid,
  '49191919-1919-4919-8919-191919191902'::uuid
);

select public.calculate_parking_exit(
  (
    select ps.id
    from public.parking_sessions ps
    join public.vehicles v on v.id = ps.vehicle_id
    where v.normalized_plate_number = 'EXVOID01'
    limit 1
  ),
  '4a1a1a1a-1a1a-4a1a-8a1a-1a1a1a1a1a01'::uuid,
  '4a1a1a1a-1a1a-4a1a-8a1a-1a1a1a1a1a02'::uuid
);

select set_config(
  'request.jwt.claims',
  '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}',
  true
);

select public.record_parking_payment(
  (
    select ps.id
    from public.parking_sessions ps
    join public.vehicles v on v.id = ps.vehicle_id
    where v.normalized_plate_number = 'EXVOID01'
    limit 1
  ),
  10000,
  null,
  '4b2b2b2b-2b2b-4b2b-8b2b-2b2b2b2b2b01'::uuid,
  '4b2b2b2b-2b2b-4b2b-8b2b-2b2b2b2b2b02'::uuid
);

select throws_ok(
  $$ select public.void_parking_payment(
    (
      select p.id
      from public.payments p
      join public.parking_sessions ps on ps.id = p.parking_session_id
      join public.vehicles v on v.id = ps.vehicle_id
      where v.normalized_plate_number = 'EXVOID01'
      limit 1
    ),
    'Void reason for permission test fixture.',
    '4c3c3c3c-3c3c-4c3c-8c3c-3c3c3c3c3c01'::uuid,
    '4c3c3c3c-3c3c-4c3c-8c3c-3c3c3c3c3c02'::uuid
  ) $$,
  'P0001',
  'INSUFFICIENT_PERMISSION',
  'staff without void permission denied'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}',
  true
);

select is(
  (
    select (public.void_parking_payment(
      (
        select p.id
        from public.payments p
        join public.parking_sessions ps on ps.id = p.parking_session_id
        join public.vehicles v on v.id = ps.vehicle_id
        where v.normalized_plate_number = 'EXVOID01'
        limit 1
      ),
      'Admin approved void for test fixture.',
      '4d4d4d4d-4d4d-4d4d-8d4d-4d4d4d4d4d01'::uuid,
      '4d4d4d4d-4d4d-4d4d-8d4d-4d4d4d4d4d02'::uuid
    )->>'session_status')
  ),
  'MANUAL_REVIEW',
  'void appends reversal and routes to manual review'
);

select cmp_ok(
  (
    select count(*)::integer
    from public.payments p
    join public.parking_sessions ps on ps.id = p.parking_session_id
    join public.vehicles v on v.id = ps.vehicle_id
    where v.normalized_plate_number = 'EXVOID01'
  ),
  '=',
  2,
  'original payment preserved with reversal row'
);

select is(
  (
    select (public.correct_parking_session(
      (
        select ps.id
        from public.parking_sessions ps
        join public.vehicles v on v.id = ps.vehicle_id
        where v.normalized_plate_number = 'EXLOST01'
        limit 1
      ),
      'DISCOUNT_PERCENT',
      jsonb_build_object('discount_percent', 10),
      'Approved ten percent discount for test.',
      '4e5e5e5e-5e5e-4e5e-8e5e-5e5e5e5e5e01'::uuid,
      '4e5e5e5e-5e5e-4e5e-8e5e-5e5e5e5e5e02'::uuid
    )->>'correction_type')
  ),
  'DISCOUNT_PERCENT',
  'discount correction appended'
);

select * from finish();

rollback;
