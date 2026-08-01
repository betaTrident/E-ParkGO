begin;

select plan(11);

select has_function('public', 'record_parking_payment', array['uuid', 'bigint', 'text', 'uuid', 'uuid']);
select has_function('public', 'list_staff_cash_totals', array['date']);

reset role;

select throws_ok(
  $$ select public.record_parking_payment(
    '11111111-1111-4111-8111-111111111111'::uuid,
    5000,
    null,
    'e0e0e0e0-e0e0-4e0e-8e0e-e0e0e0e0e001'::uuid,
    'e0e0e0e0-e0e0-4e0e-8e0e-e0e0e0e0e002'::uuid
  ) $$,
  '42501',
  'authentication required',
  'unauthenticated payment denied'
);

set local role service_role;

-- Isolate pool before payment-without-shift fixtures.
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

-- Ensure no open shift blocks payment (S2: shift not required)
select cmp_ok(
  (
    select count(*)::integer
    from public.staff_shifts ss
    where ss.profile_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
      and ss.status = 'OPEN'
  ),
  '=',
  0,
  'fixture starts with no open shift for staff actor'
);

select isnt(
  (
    select (public.create_parking_entry(
      'NOSHIFT1',
      '33333333-3333-4333-8333-333333333331'::uuid,
      null,
      'e1e1e1e1-e1e1-4e1e-8e1e-e1e1e1e1e101'::uuid,
      'e1e1e1e1-e1e1-4e1e-8e1e-e1e1e1e1e102'::uuid
    )->>'session_id')
  ),
  null,
  'payment fixture entry created without shift'
);

set local role service_role;
update public.parking_sessions ps
set entry_time = ps.entry_time - interval '3 hours'
from public.vehicles v
where v.id = ps.vehicle_id
  and v.normalized_plate_number = 'NOSHIFT1';
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
        where v.normalized_plate_number = 'NOSHIFT1'
        limit 1
      ),
      'e2e2e2e2-e2e2-4e2e-8e2e-e2e2e2e2e201'::uuid,
      'e2e2e2e2-e2e2-4e2e-8e2e-e2e2e2e2e202'::uuid
    )->>'status')
  ),
  'EXIT_PENDING',
  'fixture validated for payment'
);

select is(
  (
    select (public.calculate_parking_exit(
      (
        select ps.id
        from public.parking_sessions ps
        join public.vehicles v on v.id = ps.vehicle_id
        where v.normalized_plate_number = 'NOSHIFT1'
        limit 1
      ),
      'e3e3e3e3-e3e3-4e3e-8e3e-e3e3e3e3e301'::uuid,
      'e3e3e3e3-e3e3-4e3e-8e3e-e3e3e3e3e302'::uuid
    )->>'status')
  ),
  'PAYMENT_PENDING',
  'fixture reaches payment pending without shift'
);

select is(
  (
    select (public.record_parking_payment(
      (
        select ps.id
        from public.parking_sessions ps
        join public.vehicles v on v.id = ps.vehicle_id
        where v.normalized_plate_number = 'NOSHIFT1'
        limit 1
      ),
      5000,
      'REF-NOSHIFT1-001',
      'e4e4e4e4-e4e4-4e4e-8e4e-e4e4e4e4e401'::uuid,
      'e4e4e4e4-e4e4-4e4e-8e4e-e4e4e4e4e402'::uuid
    )->>'session_status')
  ),
  'PAID_AWAITING_EXIT',
  'payment succeeds with no open shift'
);

select is(
  (
    select p.staff_shift_id
    from public.payments p
    join public.parking_sessions ps on ps.id = p.parking_session_id
    join public.vehicles v on v.id = ps.vehicle_id
    where v.normalized_plate_number = 'NOSHIFT1'
    limit 1
  ),
  null,
  'payment stores null staff_shift_id'
);

set local role service_role;
select is(
  (
    select al.actor_id::text
    from public.audit_logs al
    where al.action = 'PAYMENT_RECORDED'
      and al.target_id = (
        select p.id
        from public.payments p
        join public.parking_sessions ps on ps.id = p.parking_session_id
        join public.vehicles v on v.id = ps.vehicle_id
        where v.normalized_plate_number = 'NOSHIFT1'
        limit 1
      )
    limit 1
  ),
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  'payment audit includes processing actor'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}',
  true
);

select ok(
  jsonb_typeof(public.list_staff_cash_totals(current_date)) = 'array',
  'staff cash totals returns json array for business date'
);

select * from finish();

rollback;
