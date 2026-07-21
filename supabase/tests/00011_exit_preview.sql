begin;

select plan(16);

select has_function(
  'public',
  'calculate_parking_exit',
  array['uuid', 'uuid', 'uuid']
);

reset role;

select throws_ok(
  $$ select public.calculate_parking_exit(
    '11111111-1111-4111-8111-111111111301'::uuid,
    '11111111-1111-4111-8111-111111111302'::uuid,
    '11111111-1111-4111-8111-111111111303'::uuid
  ) $$,
  '42501',
  'authentication required',
  'unauthenticated exit preview denied'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}',
  true
);

select isnt(
  (
    select (public.create_parking_entry(
      'EXITPREV1',
      '33333333-3333-4333-8333-333333333331'::uuid,
      null,
      '44444444-4444-4444-8444-444444444447'::uuid,
      '12121212-1212-4212-8212-121212121201'::uuid,
      '12121212-1212-4212-8212-121212121202'::uuid
    )->>'session_id')
  ),
  null,
  'exit preview fixture entry created'
);

select throws_ok(
  $$ select public.calculate_parking_exit(
    (
      select ps.id
      from public.parking_sessions ps
      join public.vehicles v on v.id = ps.vehicle_id
      where v.normalized_plate_number = 'EXITPREV1'
      limit 1
    ),
    '13131313-1313-4313-8313-131313131301'::uuid,
    '13131313-1313-4313-8313-131313131302'::uuid
  ) $$,
  'P0001',
  'INVALID_STATUS_TRANSITION',
  'ACTIVE session cannot preview exit directly'
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
        where v.normalized_plate_number = 'EXITPREV1'
        limit 1
      ),
      '14141414-1414-4414-8414-141414141401'::uuid,
      '14141414-1414-4414-8414-141414141402'::uuid
    )->>'status')
  ),
  'EXIT_PENDING',
  'validation prepares session for exit preview'
);

select is(
  (
    select (public.calculate_parking_exit(
      (
        select ps.id
        from public.parking_sessions ps
        join public.vehicles v on v.id = ps.vehicle_id
        where v.normalized_plate_number = 'EXITPREV1'
        limit 1
      ),
      '15151515-1515-4515-8515-151515151501'::uuid,
      '15151515-1515-4515-8515-151515151502'::uuid
    )->>'status')
  ),
  'PAID_AWAITING_EXIT',
  'grace-period preview uses zero-fee settlement path'
);

select ok(
  (
    select ps.quote_expires_at > now()
    from public.parking_sessions ps
    join public.vehicles v on v.id = ps.vehicle_id
    where v.normalized_plate_number = 'EXITPREV1'
    limit 1
  ),
  'quote expiry is persisted for preview'
);

select ok(
  (
    select ps.fee_calculated_at is not null
    from public.parking_sessions ps
    join public.vehicles v on v.id = ps.vehicle_id
    where v.normalized_plate_number = 'EXITPREV1'
    limit 1
  ),
  'fee calculation timestamp recorded'
);

select lives_ok(
  $$ select public.calculate_parking_exit(
    (
      select ps.id
      from public.parking_sessions ps
      join public.vehicles v on v.id = ps.vehicle_id
      where v.normalized_plate_number = 'EXITPREV1'
      limit 1
    ),
    '15151515-1515-4515-8515-151515151501'::uuid,
    '15151515-1515-4515-8515-151515151502'::uuid
  ) $$,
  'exit preview idempotent replay succeeds'
);

set local role service_role;

select is(
  (
    select ik.response_json->>'status'
    from public.idempotency_keys ik
    where ik.operation = 'calculate_parking_exit'
      and ik.key = '15151515-1515-4515-8515-151515151501'::uuid
  ),
  'PAID_AWAITING_EXIT',
  'exit preview idempotency stores sanitized response'
);

select ok(
  exists (
    select 1
    from public.audit_logs al
    join public.parking_sessions ps on ps.id = al.target_id
    join public.vehicles v on v.id = ps.vehicle_id
    where v.normalized_plate_number = 'EXITPREV1'
      and al.action = 'EXIT_FEE_CALCULATED'
  ),
  'exit preview writes calculation audit'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}',
  true
);

set local role service_role;

update public.parking_sessions ps
set
  entry_time = now() - interval '2 hours',
  status = 'EXIT_PENDING',
  payment_status = 'UNPAID',
  fee_calculated_at = null,
  quote_expires_at = null,
  total_minutes = null,
  subtotal_centavos = null,
  discount_centavos = null,
  penalty_centavos = null,
  adjustment_centavos = null,
  total_centavos = null
from public.vehicles v
where v.id = ps.vehicle_id
  and v.normalized_plate_number = 'EXITPREV1';

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}',
  true
);

select is(
  (
    select (public.calculate_parking_exit(
      (
        select ps.id
        from public.parking_sessions ps
        join public.vehicles v on v.id = ps.vehicle_id
        where v.normalized_plate_number = 'EXITPREV1'
        limit 1
      ),
      '16161616-1616-4616-8616-161616161601'::uuid,
      '16161616-1616-4616-8616-161616161602'::uuid
    )->>'status')
  ),
  'PAYMENT_PENDING',
  'nonzero fee preview moves session to PAYMENT_PENDING'
);

select cmp_ok(
  (
    select (public.calculate_parking_exit(
      (
        select ps.id
        from public.parking_sessions ps
        join public.vehicles v on v.id = ps.vehicle_id
        where v.normalized_plate_number = 'EXITPREV1'
        limit 1
      ),
      '17171717-1717-4717-8717-171717171701'::uuid,
      '17171717-1717-4717-8717-171717171702'::uuid
    )->>'total_centavos')::bigint
  ),
  '>',
  0::bigint,
  'nonzero preview exposes positive total centavos'
);

select isnt(
  (
    select (public.create_parking_entry(
      'EXITPREV2',
      '33333333-3333-4333-8333-333333333331'::uuid,
      null,
      '44444444-4444-4444-8444-444444444448'::uuid,
      '19191919-1919-4919-8919-191919191901'::uuid,
      '19191919-1919-4919-8919-191919191902'::uuid
    )->>'session_id')
  ),
  null,
  'idempotency conflict fixture entry created'
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
        where v.normalized_plate_number = 'EXITPREV2'
        limit 1
      ),
      '1a1a1a1a-1a1a-4a1a-8a1a-1a1a1a1a1a01'::uuid,
      '1a1a1a1a-1a1a-4a1a-8a1a-1a1a1a1a1a02'::uuid
    )->>'status')
  ),
  'EXIT_PENDING',
  'idempotency conflict fixture prepared'
);

select throws_ok(
  $$ select public.calculate_parking_exit(
    (
      select ps.id
      from public.parking_sessions ps
      join public.vehicles v on v.id = ps.vehicle_id
      where v.normalized_plate_number = 'EXITPREV2'
      limit 1
    ),
    '15151515-1515-4515-8515-151515151501'::uuid,
    '18181818-1818-4818-8818-181818181801'::uuid
  ) $$,
  'P0001',
  'IDEMPOTENCY_CONFLICT',
  'changed exit preview payload with same idempotency key rejected'
);

select * from finish();

rollback;
