begin;

select plan(19);

select has_function(
  'public',
  'validate_parking_ticket',
  array['text', 'text', 'uuid', 'uuid']
);

reset role;

select throws_ok(
  $$ select public.validate_parking_ticket(
    null,
    'EPG-260721-TEST00001A',
    '11111111-1111-4111-8111-111111111201'::uuid,
    '11111111-1111-4111-8111-111111111202'::uuid
  ) $$,
  '42501',
  'authentication required',
  'unauthenticated validation denied'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}',
  true
);

select throws_ok(
  $$ select public.validate_parking_ticket(
    'not-a-valid-token-shape',
    null,
    '11111111-1111-4111-8111-111111111203'::uuid,
    '11111111-1111-4111-8111-111111111204'::uuid
  ) $$,
  'P0001',
  'TICKET_INVALID',
  'malformed token rejected before hash lookup'
);

select throws_ok(
  $$ select public.validate_parking_ticket(
    null,
    null,
    '11111111-1111-4111-8111-111111111205'::uuid,
    '11111111-1111-4111-8111-111111111206'::uuid
  ) $$,
  '22023',
  'exactly one lookup input is required',
  'missing lookup input rejected'
);

select throws_ok(
  $$ select public.validate_parking_ticket(
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN',
    'EPG-260721-TEST00001A',
    '11111111-1111-4111-8111-111111111207'::uuid,
    '11111111-1111-4111-8111-111111111208'::uuid
  ) $$,
  '22023',
  'exactly one lookup input is required',
  'dual lookup input rejected'
);

select throws_ok(
  $$ select public.validate_parking_ticket(
    null,
    'EPG-UNKNOWN-TICKET',
    '11111111-1111-4111-8111-111111111209'::uuid,
    '11111111-1111-4111-8111-111111111210'::uuid
  ) $$,
  'P0001',
  'TICKET_INVALID',
  'unknown ticket rejected'
);

-- Fresh entry for validation lifecycle
select isnt(
  (
    select (public.create_parking_entry(
      'VALTEST1',
      '33333333-3333-4333-8333-333333333331'::uuid,
      null,
      '44444444-4444-4444-8444-444444444444'::uuid,
      '22222222-2222-4222-8222-222222222221'::uuid,
      '22222222-2222-4222-8222-222222222222'::uuid
    )->>'qr_payload')
  ),
  null,
  'validation fixture entry created'
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
        where v.normalized_plate_number = 'VALTEST1'
        order by pt.created_at desc
        limit 1
      ),
      '33333333-3333-4333-8333-333333333331'::uuid,
      '33333333-3333-4333-8333-333333333332'::uuid
    )->>'status')
  ),
  'EXIT_PENDING',
  'manual ticket validation moves session to EXIT_PENDING'
);

select is(
  (
    select ps.status::text
    from public.parking_sessions ps
    join public.vehicles v on v.id = ps.vehicle_id
    where v.normalized_plate_number = 'VALTEST1'
    order by ps.created_at desc
    limit 1
  ),
  'EXIT_PENDING',
  'session persisted EXIT_PENDING after validation'
);

select lives_ok(
  $$ select public.validate_parking_ticket(
    null,
    (
      select pt.ticket_number::text
      from public.parking_tickets pt
      join public.parking_sessions ps on ps.id = pt.parking_session_id
      join public.vehicles v on v.id = ps.vehicle_id
      where v.normalized_plate_number = 'VALTEST1'
      order by pt.created_at desc
      limit 1
    ),
    '44444444-4444-4444-8444-444444444441'::uuid,
    '44444444-4444-4444-8444-444444444442'::uuid
  ) $$,
  'duplicate scan on EXIT_PENDING session is safe'
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
        where v.normalized_plate_number = 'VALTEST1'
        order by pt.created_at desc
        limit 1
      ),
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa11'::uuid,
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb11'::uuid
    )->>'status')
  ),
  'EXIT_PENDING',
  'idempotent validation replay returns safe review state'
);

set local role service_role;

select is(
  (
    select ik.response_json->>'status'
    from public.idempotency_keys ik
    where ik.operation = 'validate_parking_ticket'
      and ik.key = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa11'::uuid
  ),
  'EXIT_PENDING',
  'validation idempotency stores sanitized response'
);

select ok(
  not exists (
    select 1
    from public.idempotency_keys ik
    where ik.operation = 'validate_parking_ticket'
      and ik.response_json::text ilike '%qr%'
  ),
  'validation idempotency never stores token material'
);

select ok(
  (
    select count(*) >= 1
    from public.audit_logs al
    join public.parking_sessions ps on ps.id = al.target_id
    join public.vehicles v on v.id = ps.vehicle_id
    where v.normalized_plate_number = 'VALTEST1'
      and al.action = 'TICKET_VALIDATED'
  ),
  'validation writes bounded scan audit evidence'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}',
  true
);

-- Token path validation
select isnt(
  (
    select (public.create_parking_entry(
      'VALTEST2',
      '33333333-3333-4333-8333-333333333331'::uuid,
      null,
      '44444444-4444-4444-8444-444444444445'::uuid,
      '55555555-5555-4555-8555-555555555551'::uuid,
      '55555555-5555-4555-8555-555555555552'::uuid
    )->>'qr_payload')
  ),
  null,
  'token validation fixture entry created'
);

select is(
  (
    select (public.validate_parking_ticket(
      split_part(
        (
          select public.create_parking_entry(
            'VALTEST3',
            '33333333-3333-4333-8333-333333333331'::uuid,
            null,
            '44444444-4444-4444-8444-444444444446'::uuid,
            '66666666-6666-4666-8666-666666666661'::uuid,
            '66666666-6666-4666-8666-666666666662'::uuid
          )->>'qr_payload'
        ),
        '#v1.',
        2
      ),
      null,
      '77777777-7777-4777-8777-777777777771'::uuid,
      '77777777-7777-4777-8777-777777777772'::uuid
    )->>'status')
  ),
  'EXIT_PENDING',
  'token validation moves ACTIVE session to EXIT_PENDING'
);

set local role service_role;

update public.parking_tickets pt
set status = 'REVOKED', revoked_at = now()
where pt.ticket_number = (
  select pt2.ticket_number
  from public.parking_tickets pt2
  join public.parking_sessions ps on ps.id = pt2.parking_session_id
  join public.vehicles v on v.id = ps.vehicle_id
  where v.normalized_plate_number = 'VALTEST2'
  limit 1
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}',
  true
);

select throws_ok(
  $$ select public.validate_parking_ticket(
    null,
    (
      select pt.ticket_number::text
      from public.parking_tickets pt
      join public.parking_sessions ps on ps.id = pt.parking_session_id
      join public.vehicles v on v.id = ps.vehicle_id
      where v.normalized_plate_number = 'VALTEST2'
      limit 1
    ),
    '88888888-8888-4888-8888-888888888881'::uuid,
    '88888888-8888-4888-8888-888888888882'::uuid
  ) $$,
  'P0001',
  'TICKET_REVOKED',
  'revoked ticket rejected'
);

set local role service_role;

insert into public.rate_limit_buckets (
  actor_id,
  parking_location_id,
  operation,
  bucket_start,
  request_count,
  blocked_until
)
values (
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  '11111111-1111-4111-8111-111111111111',
  'validate_parking_ticket',
  to_timestamp(floor(extract(epoch from now()) / 300) * 300),
  120,
  null
)
on conflict (actor_id, operation, bucket_start)
do update set request_count = excluded.request_count;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}',
  true
);

select throws_ok(
  $$ select public.validate_parking_ticket(
    null,
    (
      select pt.ticket_number::text
      from public.parking_tickets pt
      join public.parking_sessions ps on ps.id = pt.parking_session_id
      join public.vehicles v on v.id = ps.vehicle_id
      where v.normalized_plate_number = 'VALTEST1'
      limit 1
    ),
    '99999999-9999-4999-8999-999999999991'::uuid,
    '99999999-9999-4999-8999-999999999992'::uuid
  ) $$,
  'P0001',
  'RATE_LIMITED',
  'validation rate limit enforced'
);

set local role service_role;

delete from public.rate_limit_buckets
where actor_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
  and operation = 'validate_parking_ticket';

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}',
  true
);

select throws_ok(
  $$ select public.validate_parking_ticket(
    split_part(
      (
        select public.create_parking_entry(
          'VALTEST4',
          '33333333-3333-4333-8333-333333333331'::uuid,
          null,
          '44444444-4444-4444-8444-44444444444c'::uuid,
          'dddddddd-dddd-4ddd-8ddd-dddddddddd11'::uuid,
          'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee11'::uuid
        )->>'qr_payload'
      ),
      '#v1.',
      2
    ),
    null,
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa11'::uuid,
    'dddddddd-dddd-4ddd-8ddd-dddddddddd12'::uuid
  ) $$,
  'P0001',
  'IDEMPOTENCY_CONFLICT',
  'changed validation payload with same idempotency key rejected'
);

select * from finish();

rollback;
