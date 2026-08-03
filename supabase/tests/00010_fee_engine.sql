begin;

select plan(18);

select has_function(
  'private',
  'calculate_parking_fee',
  array[
    'parking_rate_snapshots',
    'timestamptz',
    'timestamptz',
    'text',
    'bigint',
    'integer',
    'boolean',
    'bigint'
  ]
);

create or replace function private.test_phase7_tiered_snapshot()
returns public.parking_rate_snapshots
language sql
immutable
set search_path = ''
as $$
  select row(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid,
    '11111111-1111-4111-8111-111111111111'::uuid,
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'::uuid,
    '55555555-5555-4555-8555-555555555551'::uuid,
    2,
    'TIERED'::public.rate_mode,
    15,
    180,
    5000::bigint,
    60,
    2000::bigint,
    null::bigint,
    30000::bigint,
    5000::bigint,
    20000::bigint,
    '{}'::jsonb,
    decode(repeat('00', 32), 'hex'),
    timestamptz '2026-01-01 00:00:00+00'
  )::public.parking_rate_snapshots;
$$;

select is(
  (
    select (private.calculate_parking_fee(
      private.test_phase7_tiered_snapshot(),
      timestamptz '2026-07-21 10:00:00+00',
      timestamptz '2026-07-21 10:00:00+00'
    )->>'total_centavos')::bigint
  ),
  0::bigint,
  '0 minutes within grace is zero'
);

select is(
  (
    select (private.calculate_parking_fee(
      private.test_phase7_tiered_snapshot(),
      timestamptz '2026-07-21 10:00:00+00',
      timestamptz '2026-07-21 10:15:00+00'
    )->>'total_centavos')::bigint
  ),
  0::bigint,
  '15 minutes within grace is zero'
);

select is(
  (
    select (private.calculate_parking_fee(
      private.test_phase7_tiered_snapshot(),
      timestamptz '2026-07-21 10:00:00+00',
      timestamptz '2026-07-21 10:16:00+00'
    )->>'total_centavos')::bigint
  ),
  5000::bigint,
  '16 minutes charges initial block'
);

select is(
  (
    select (private.calculate_parking_fee(
      private.test_phase7_tiered_snapshot(),
      timestamptz '2026-07-21 10:00:00+00',
      timestamptz '2026-07-21 13:00:00+00'
    )->>'total_centavos')::bigint
  ),
  5000::bigint,
  '180 minutes charges initial block only'
);

select is(
  (
    select (private.calculate_parking_fee(
      private.test_phase7_tiered_snapshot(),
      timestamptz '2026-07-21 10:00:00+00',
      timestamptz '2026-07-21 13:01:00+00'
    )->>'total_centavos')::bigint
  ),
  7000::bigint,
  '181 minutes adds one succeeding interval'
);

select is(
  (
    select (private.calculate_parking_fee(
      private.test_phase7_tiered_snapshot(),
      timestamptz '2026-07-21 10:00:00+00',
      timestamptz '2026-07-21 14:00:00+00'
    )->>'total_centavos')::bigint
  ),
  7000::bigint,
  '240 minutes stays at one succeeding interval'
);

select is(
  (
    select (private.calculate_parking_fee(
      private.test_phase7_tiered_snapshot(),
      timestamptz '2026-07-21 10:00:00+00',
      timestamptz '2026-07-21 14:01:00+00'
    )->>'total_centavos')::bigint
  ),
  9000::bigint,
  '241 minutes adds second succeeding interval'
);

select is(
  (
    select (private.calculate_parking_fee(
      private.test_phase7_tiered_snapshot(),
      timestamptz '2026-07-20 14:00:00+00',
      timestamptz '2026-07-20 18:00:00+00'
    )->>'total_centavos')::bigint
  ),
  12000::bigint,
  'four hour evening stay with one overnight boundary'
);

select is(
  (
    select (private.calculate_parking_fee(
      private.test_phase7_tiered_snapshot(),
      timestamptz '2026-07-20 00:00:00+00',
      timestamptz '2026-07-21 02:00:01+00'
    )->>'total_centavos')::bigint
  ),
  40000::bigint,
  '26 hour cross-day stay matches capped multi-block vector'
);

select is(
  (
    select (private.calculate_parking_fee(
      private.test_phase7_tiered_snapshot(),
      timestamptz '2026-07-21 10:00:00+00',
      timestamptz '2026-07-21 10:00:01+00'
    )->>'total_centavos')::bigint
  ),
  0::bigint,
  'one second past entry remains within grace bucket'
);

select is(
  (
    select (private.calculate_parking_fee(
      private.test_phase7_tiered_snapshot(),
      timestamptz '2026-07-21 10:00:00+00',
      timestamptz '2026-07-21 10:01:01+00'
    )->>'billed_minutes')::integer
  ),
  2,
  '61 seconds bills two minutes via ceiling'
);

select is(
  (
    select (private.calculate_parking_fee(
      private.test_phase7_tiered_snapshot(),
      timestamptz '2026-07-21 10:00:00+00',
      timestamptz '2026-07-21 15:00:00+00',
      'Asia/Manila',
      20000,
      10,
      false,
      0
    )->>'total_centavos')::bigint
  ),
  28100::bigint,
  'discount and penalty ordering matches approved vector'
);

select is(
  (
    select (private.calculate_parking_fee(
      private.test_phase7_tiered_snapshot(),
      timestamptz '2026-07-21 10:00:00+00',
      timestamptz '2026-07-21 15:00:00+00',
      'Asia/Manila',
      0,
      10,
      true,
      0
    )->>'total_centavos')::bigint
  ),
  0::bigint,
  'complimentary zeros eligible base while keeping penalties at zero'
);

select is(
  (
    select (private.calculate_parking_fee(
      private.test_phase7_tiered_snapshot(),
      timestamptz '2026-07-21 10:00:00+00',
      timestamptz '2026-07-21 10:16:00+00',
      'Asia/Manila',
      0,
      0,
      false,
      -1000
    )->>'total_centavos')::bigint
  ),
  4000::bigint,
  'signed adjustment applied after base calculation'
);

select is(
  (
    select (private.calculate_parking_fee(
      private.test_phase7_tiered_snapshot(),
      timestamptz '2026-07-21 10:00:00+00',
      timestamptz '2026-07-21 10:16:00+00',
      'Asia/Manila',
      0,
      0,
      false,
      -10000
    )->>'total_centavos')::bigint
  ),
  0::bigint,
  'final total cannot be negative'
);

select is(
  (
    select private.calculate_parking_fee(
      private.test_phase7_tiered_snapshot(),
      timestamptz '2026-07-21 10:00:00+00',
      timestamptz '2026-07-21 10:30:00+00'
    )->>'fee_version'
  ),
  '2',
  'fee version comes from immutable snapshot'
);

select is(
  (
    select (private.calculate_parking_fee(
      private.test_phase7_tiered_snapshot(),
      timestamptz '2026-07-21 10:00:00+00',
      timestamptz '2026-07-22 10:00:01+00'
    )->>'total_centavos')::bigint
  ),
  35000::bigint,
  '24 hours 1 minute applies daily cap, grace on next partial block, and one overnight boundary'
);

select * from finish();

rollback;
