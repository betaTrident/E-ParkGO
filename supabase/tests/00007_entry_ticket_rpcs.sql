begin;

select plan(32);

select has_function(
  'public',
  'create_parking_entry',
  array['text', 'uuid', 'text', 'uuid', 'uuid', 'uuid']
);
select has_function(
  'public',
  'reissue_parking_ticket',
  array['uuid', 'text', 'uuid', 'uuid']
);

reset role;

-- Unauthenticated entry denied
select throws_ok(
  $$ select public.create_parking_entry(
    'ABC1234',
    '33333333-3333-4333-8333-333333333331'::uuid,
    'Blue',
    '44444444-4444-4444-8444-444444444441'::uuid,
    '11111111-1111-4111-8111-111111111112'::uuid,
    '11111111-1111-4111-8111-111111111113'::uuid
  ) $$,
  '42501',
  'authentication required',
  'unauthenticated entry denied'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}',
  true
);

-- Invalid plate rejected
select throws_ok(
  $$ select public.create_parking_entry(
    'A',
    '33333333-3333-4333-8333-333333333331'::uuid,
    null,
    '44444444-4444-4444-8444-444444444441'::uuid,
    '11111111-1111-4111-8111-111111111114'::uuid,
    '11111111-1111-4111-8111-111111111115'::uuid
  ) $$,
  '22023',
  'invalid plate number',
  'short plate rejected'
);

-- Successful entry returns token once
select isnt(
  (
    select (public.create_parking_entry(
      'abc-1234',
      '33333333-3333-4333-8333-333333333331'::uuid,
      'Blue',
      '44444444-4444-4444-8444-444444444441'::uuid,
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01'::uuid,
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb01'::uuid
    )->>'qr_payload')
  ),
  null,
  'first entry response includes qr payload'
);

select lives_ok(
  $$ select public.create_parking_entry(
    'abc-1234',
    '33333333-3333-4333-8333-333333333331'::uuid,
    'Blue',
    '44444444-4444-4444-8444-444444444441'::uuid,
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01'::uuid,
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb01'::uuid
  ) $$,
  'staff entry idempotent replay succeeds'
);

select is(
  (
    select (public.create_parking_entry(
      'abc-1234',
      '33333333-3333-4333-8333-333333333331'::uuid,
      'Blue',
      '44444444-4444-4444-8444-444444444441'::uuid,
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01'::uuid,
      'cccccccc-cccc-4ccc-8ccc-cccccccccc01'::uuid
    )->>'credential_recovery')
  ),
  'REISSUE_REQUIRED',
  'idempotent replay omits token and requires reissue'
);

select is(
  (
    select (public.create_parking_entry(
      'abc-1234',
      '33333333-3333-4333-8333-333333333331'::uuid,
      'Blue',
      '44444444-4444-4444-8444-444444444441'::uuid,
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01'::uuid,
      'cccccccc-cccc-4ccc-8ccc-cccccccccc01'::uuid
    )->>'qr_payload')
  ),
  null,
  'idempotent replay never returns qr payload'
);

select throws_ok(
  $$ select public.create_parking_entry(
    'abc-1234',
    '33333333-3333-4333-8333-333333333331'::uuid,
    'Red',
    '44444444-4444-4444-8444-444444444442'::uuid,
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01'::uuid,
    'dddddddd-dddd-4ddd-8ddd-dddddddddd01'::uuid
  ) $$,
  'P0001',
  'IDEMPOTENCY_CONFLICT',
  'changed payload with same idempotency key rejected'
);

-- Vehicle reuse and normalization
select is(
  (
    select normalized_plate_number
    from public.vehicles
    where parking_location_id = '11111111-1111-4111-8111-111111111111'
      and normalized_plate_number = 'ABC1234'
  ),
  'ABC1234',
  'plate normalized to uppercase alphanumeric'
);

select is(
  (
    select count(*)::integer
    from public.vehicles
    where parking_location_id = '11111111-1111-4111-8111-111111111111'
      and normalized_plate_number = 'ABC1234'
  ),
  1,
  'vehicle row reused for same normalized plate'
);

-- Occupied space and session side effects
select is(
  (
    select status::text
    from public.parking_spaces
    where id = '44444444-4444-4444-8444-444444444441'
  ),
  'OCCUPIED',
  'space marked occupied after entry'
);

select isnt_empty(
  $$ select 1
     from public.parking_sessions ps
     join public.parking_rate_snapshots prs on prs.parking_session_id = ps.id
     where ps.parking_space_id = '44444444-4444-4444-8444-444444444441'
       and ps.status = 'ACTIVE' $$,
  'entry stores immutable rate snapshot'
);

select isnt_empty(
  $$ select 1
     from public.parking_tickets pt
     join public.parking_sessions ps on ps.id = pt.parking_session_id
     where ps.parking_space_id = '44444444-4444-4444-8444-444444444441'
       and pt.status = 'ACTIVE'
       and octet_length(pt.qr_token_hash) = 32 $$,
  'ticket stores 32-byte qr hash only'
);

set local role service_role;

select is(
  (
    select count(*)::integer
    from public.audit_logs
    where action = 'PARKING_ENTRY_CREATED'
      and parking_location_id = '11111111-1111-4111-8111-111111111111'
  ),
  1,
  'entry audit recorded once'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}',
  true
);

-- Active session conflict on same plate
select throws_ok(
  $$ select public.create_parking_entry(
    'ABC-1234',
    '33333333-3333-4333-8333-333333333331'::uuid,
    null,
    '44444444-4444-4444-8444-444444444442'::uuid,
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee01'::uuid,
    'ffffffff-ffff-4fff-8fff-ffffffffff01'::uuid
  ) $$,
  'P0001',
  'ACTIVE_SESSION_EXISTS',
  'duplicate active session for same plate rejected'
);

-- Space unavailable
select throws_ok(
  $$ select public.create_parking_entry(
    'XYZ9876',
    '33333333-3333-4333-8333-333333333331'::uuid,
    null,
    '44444444-4444-4444-8444-444444444441'::uuid,
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee02'::uuid,
    'ffffffff-ffff-4fff-8fff-ffffffffff02'::uuid
  ) $$,
  'P0001',
  'SPACE_NOT_AVAILABLE',
  'occupied space rejected'
);

-- Incompatible vehicle type for dedicated space
select throws_ok(
  $$ select public.create_parking_entry(
    'MOTO123',
    '33333333-3333-4333-8333-333333333331'::uuid,
    null,
    '44444444-4444-4444-8444-444444444443'::uuid,
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee03'::uuid,
    'ffffffff-ffff-4fff-8fff-ffffffffff03'::uuid
  ) $$,
  'P0001',
  'SPACE_NOT_AVAILABLE',
  'incompatible vehicle type for space rejected'
);

-- Missing published rate for vehicle type
select throws_ok(
  $$ select public.create_parking_entry(
    'NORATE1',
    '33333333-3333-4333-8333-333333333332'::uuid,
    null,
    '44444444-4444-4444-8444-444444444443'::uuid,
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee04'::uuid,
    'ffffffff-ffff-4fff-8fff-ffffffffff04'::uuid
  ) $$,
  'P0001',
  'RATE_NOT_CONFIGURED',
  'missing effective rate rejected'
);

set local role service_role;

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

-- Token encoded length matches 32-byte credential
select is(
  (
    select char_length(
      split_part(
        (public.create_parking_entry(
          'TOKTEST',
          '33333333-3333-4333-8333-333333333332'::uuid,
          null,
          '44444444-4444-4444-8444-444444444443'::uuid,
          '12121212-1212-4212-8212-121212121201'::uuid,
          '13131313-1313-4313-8313-131313131301'::uuid
        )->>'qr_payload'),
        '#v1.',
        2
      )
    )
  ),
  43,
  'qr token encodes 32 bytes as unpadded base64url'
);

-- Idempotency storage excludes token
set local role service_role;

select ok(
  not exists (
    select 1
    from public.idempotency_keys ik
    where ik.operation = 'create_parking_entry'
      and ik.response_json::text ilike '%qr_payload%'
  ),
  'idempotency replay record excludes qr payload'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}',
  true
);

-- Reissue revokes prior ticket and returns new credential once
select isnt(
  (
    select (public.reissue_parking_ticket(
      (
        select ps.id
        from public.parking_sessions ps
        where ps.parking_space_id = '44444444-4444-4444-8444-444444444441'
        limit 1
      ),
      'Ticket damaged during print',
      '14141414-1414-4414-8414-141414141401'::uuid,
      '15151515-1515-4515-8515-151515151501'::uuid
    )->>'qr_payload')
  ),
  null,
  'first reissue response includes qr payload'
);

select lives_ok(
  $$ select public.reissue_parking_ticket(
    (
      select ps.id
      from public.parking_sessions ps
      where ps.parking_space_id = '44444444-4444-4444-8444-444444444441'
      limit 1
    ),
    'Ticket damaged during print',
    '14141414-1414-4414-8414-141414141401'::uuid,
    '15151515-1515-4515-8515-151515151501'::uuid
  ) $$,
  'staff reissue idempotent replay succeeds'
);

select is(
  (
    select count(*)::integer
    from public.parking_tickets pt
    join public.parking_sessions ps on ps.id = pt.parking_session_id
    where ps.parking_space_id = '44444444-4444-4444-8444-444444444441'
      and pt.status = 'REVOKED'
  ),
  1,
  'prior ticket revoked after reissue'
);

select is(
  (
    select count(*)::integer
    from public.parking_tickets pt
    join public.parking_sessions ps on ps.id = pt.parking_session_id
    where ps.parking_space_id = '44444444-4444-4444-8444-444444444441'
      and pt.status = 'ACTIVE'
  ),
  1,
  'exactly one active ticket remains per session'
);

select ok(
  (
    select count(distinct pt.ticket_number)
    from public.parking_tickets pt
    join public.parking_sessions ps on ps.id = pt.parking_session_id
    where ps.parking_space_id = '44444444-4444-4444-8444-444444444441'
  ) >= 2,
  'reissue creates a distinct ticket number'
);

select ok(
  (
    select count(distinct pt.qr_token_hash)
    from public.parking_tickets pt
    join public.parking_sessions ps on ps.id = pt.parking_session_id
    where ps.parking_space_id = '44444444-4444-4444-8444-444444444441'
  ) >= 2,
  'reissue creates a distinct qr hash'
);

select is(
  (
    select (public.reissue_parking_ticket(
      (
        select ps.id
        from public.parking_sessions ps
        where ps.parking_space_id = '44444444-4444-4444-8444-444444444441'
        limit 1
      ),
      'Ticket damaged during print',
      '14141414-1414-4414-8414-141414141401'::uuid,
      '17171717-1717-4717-8717-171717171701'::uuid
    )->>'credential_recovery')
  ),
  'REISSUE_REQUIRED',
  'reissue replay requires another intentional reissue'
);

set local role service_role;

select ok(
  exists (
    select 1
    from public.audit_logs
    where action = 'PARKING_TICKET_REISSUED'
      and parking_location_id = '11111111-1111-4111-8111-111111111111'
  ),
  'reissue audit recorded'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}',
  true
);

-- Grants: authenticated may execute, anon may not
select ok(
  has_function_privilege(
    'authenticated',
    'public.create_parking_entry(text,uuid,text,uuid,uuid,uuid)',
    'EXECUTE'
  ),
  'authenticated can execute create_parking_entry'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.create_parking_entry(text,uuid,text,uuid,uuid,uuid)',
    'EXECUTE'
  ),
  'anon cannot execute create_parking_entry'
);

select ok(
  has_function_privilege(
    'authenticated',
    'public.reissue_parking_ticket(uuid,text,uuid,uuid)',
    'EXECUTE'
  ),
  'authenticated can execute reissue_parking_ticket'
);

select * from finish();
rollback;
