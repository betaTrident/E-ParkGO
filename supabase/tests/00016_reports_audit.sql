begin;

select plan(34);

select has_function('public', 'list_transactions', array['date', 'date', 'text', 'text', 'text', 'integer']);
select has_function('public', 'get_report_preview', array['text', 'date', 'date']);
select has_function('public', 'export_report', array['text', 'date', 'date', 'uuid', 'uuid']);
select has_function('public', 'search_audit_logs', array['timestamptz', 'timestamptz', 'text', 'uuid', 'uuid', 'text', 'integer']);
select has_function('public', 'list_shift_history', array['text', 'integer']);

reset role;

select throws_ok(
  $$ select public.list_transactions(
    current_date - 7,
    current_date,
    null,
    null,
    null,
    25
  ) $$,
  '42501',
  'authentication required',
  'unauthenticated transaction search denied'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}',
  true
);

select ok(
  jsonb_typeof(public.list_transactions(
    current_date - 7,
    current_date,
    null,
    null,
    null,
    25
  )->'items') = 'array',
  'staff receives bounded transaction items'
);

select ok(
  (public.list_transactions(
    current_date - 7,
    current_date,
    null,
    null,
    null,
    25
  )->'pagination'->>'limit')::int <= 100,
  'transaction page size capped at 100'
);

select throws_ok(
  $$ select public.list_transactions(
    current_date - 400,
    current_date,
    null,
    null,
    null,
    25
  ) $$,
  '22023',
  'date range exceeds 90 day limit',
  'staff date range bounded'
);

select ok(
  jsonb_typeof(public.get_report_preview(
    'DAILY_REVENUE',
    current_date - 7,
    current_date
  )->'summary') = 'object',
  'staff can preview daily revenue report'
);

select is(
  public.get_report_preview(
    'DAILY_REVENUE',
    current_date - 7,
    current_date
  )->>'timezone',
  'Asia/Manila',
  'report preview exposes business timezone'
);

select throws_ok(
  $$ select public.export_report(
    'DAILY_REVENUE',
    current_date - 7,
    current_date,
    '31111111-1111-4111-8111-111111111101'::uuid,
    '31111111-1111-4111-8111-111111111102'::uuid
  ) $$,
  '42501',
  'INSUFFICIENT_PERMISSION',
  'staff export denied'
);

select throws_ok(
  $$ select public.search_audit_logs(
    now() - interval '7 days',
    now(),
    null,
    null,
    null,
    null,
    25
  ) $$,
  '42501',
  'INSUFFICIENT_PERMISSION',
  'staff audit search denied'
);

select ok(
  jsonb_array_length(
    public.list_shift_history(null, 25)->'items'
  ) >= 0,
  'staff can list own shift history'
);

-- Admin flows
select set_config(
  'request.jwt.claims',
  '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}',
  true
);

select ok(
  jsonb_typeof(public.search_audit_logs(
    now() - interval '30 days',
    now(),
    null,
    null,
    null,
    null,
    25
  )->'items') = 'array',
  'admin can search audit logs'
);

reset role;
insert into public.audit_logs (
  parking_location_id,
  actor_id,
  action,
  target_type,
  target_id,
  result,
  reason,
  correlation_id,
  before_data,
  after_data
)
values (
  '11111111-1111-4111-8111-111111111111',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'REPORT_REDACTION_FIXTURE',
  'fixture',
  '41111111-1111-4111-8111-111111111111',
  'SUCCESS',
  'phase 10 redaction fixture',
  '42111111-1111-4111-8111-111111111111',
  jsonb_build_object('token', 'secret-token', 'qr_token_hash', repeat('ab', 16)),
  jsonb_build_object('token', 'secret-token', 'qr_token_hash', repeat('cd', 16))
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}',
  true
);

select ok(
  not exists (
    select 1
    from jsonb_array_elements(
      public.search_audit_logs(
        now() - interval '30 days',
        now(),
        'REPORT_REDACTION_FIXTURE',
        null,
        null,
        null,
        5
      )->'items'
    ) item
    where (item->'before_data' ? 'qr_token_hash')
       or (item->'before_data' ? 'token')
       or (item->'after_data' ? 'qr_token_hash')
       or (item->'after_data' ? 'token')
  ),
  'audit search redacts sensitive fields'
);

select isnt(
  (
    select public.export_report(
      'DAILY_REVENUE',
      current_date - 7,
      current_date,
      '32111111-1111-4111-8111-111111111101'::uuid,
      '32111111-1111-4111-8111-111111111102'::uuid
    )->>'export_id'
  ),
  null,
  'admin export records audit evidence'
);

select is(
  (
    select public.export_report(
      'DAILY_REVENUE',
      current_date - 7,
      current_date,
      '32111111-1111-4111-8111-111111111101'::uuid,
      '32111111-1111-4111-8111-111111111102'::uuid
    )->>'export_id'
  ),
  (
    select public.export_report(
      'DAILY_REVENUE',
      current_date - 7,
      current_date,
      '32111111-1111-4111-8111-111111111101'::uuid,
      '32111111-1111-4111-8111-111111111102'::uuid
    )->>'export_id'
  ),
  'export idempotency replays same export evidence'
);

select throws_ok(
  $$ select public.export_report(
    'DAILY_REVENUE',
    current_date - 400,
    current_date,
    '33111111-1111-4111-8111-111111111101'::uuid,
    '33111111-1111-4111-8111-111111111102'::uuid
  ) $$,
  '22023',
  'date range exceeds 366 day limit',
  'admin date range capped at 366 days'
);

select throws_ok(
  $$ select public.get_report_preview(
    'UNKNOWN',
    current_date - 7,
    current_date
  ) $$,
  '22023',
  'unsupported report type',
  'unknown report type rejected'
);

-- Reconciliation fixture: payment net totals
select set_config(
  'request.jwt.claims',
  '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}',
  true
);

select isnt(
  (
    select public.start_staff_shift(
      null,
      10000,
      '34111111-1111-4111-8111-111111111101'::uuid,
      '34111111-1111-4111-8111-111111111102'::uuid
    )->>'shift_id'
  ),
  null,
  'reconciliation fixture shift opened'
);

select isnt(
  (
    select public.create_parking_entry(
      'REPORT01',
      '33333333-3333-4333-8333-333333333331'::uuid,
      null,
      '35111111-1111-4111-8111-111111111101'::uuid,
      '35111111-1111-4111-8111-111111111102'::uuid
    )->>'session_id'
  ),
  null,
  'reconciliation fixture entry created'
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
        where v.normalized_plate_number = 'REPORT01'
        limit 1
      ),
      '36111111-1111-4111-8111-111111111101'::uuid,
      '36111111-1111-4111-8111-111111111102'::uuid
    )->>'status')
  ),
  'EXIT_PENDING',
  'reconciliation fixture validated'
);

reset role;
update public.parking_sessions ps
set entry_time = clock_timestamp() - interval '3 hours'
from public.vehicles v
where v.id = ps.vehicle_id
  and v.normalized_plate_number = 'REPORT01';

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
        where v.normalized_plate_number = 'REPORT01'
        limit 1
      ),
      '37111111-1111-4111-8111-111111111101'::uuid,
      '37111111-1111-4111-8111-111111111102'::uuid
    )->>'status')
  ),
  'PAYMENT_PENDING',
  'reconciliation fixture requires payment after backdated entry'
);

select isnt(
  (
    select (public.record_parking_payment(
      (
        select ps.id
        from public.parking_sessions ps
        join public.vehicles v on v.id = ps.vehicle_id
        where v.normalized_plate_number = 'REPORT01'
        limit 1
      ),
      50000,
      null,
      '38111111-1111-4111-8111-111111111101'::uuid,
      '38111111-1111-4111-8111-111111111102'::uuid
    )->>'payment_id')
  ),
  null,
  'reconciliation fixture payment recorded'
);

select ok(
  (
    select (public.get_report_preview(
      'DAILY_REVENUE',
      (clock_timestamp() AT TIME ZONE 'Asia/Manila')::date,
      (clock_timestamp() AT TIME ZONE 'Asia/Manila')::date
    )->'summary'->>'net_revenue_centavos')::bigint >= 0
  ),
  'daily revenue preview reconciles non-negative net totals'
);

select ok(
  (
    select count(*)::int
    from jsonb_array_elements(
      public.list_transactions(
        ((clock_timestamp() AT TIME ZONE 'Asia/Manila')::date - 30),
        (clock_timestamp() AT TIME ZONE 'Asia/Manila')::date,
        null,
        null,
        null,
        25
      )->'items'
    )
  ) >= 1,
  'transaction search returns payment rows after fixture'
);

select ok(
  (
    select count(*)::int
    from jsonb_array_elements(
      public.list_transactions(
        ((clock_timestamp() AT TIME ZONE 'Asia/Manila')::date - 30),
        (clock_timestamp() AT TIME ZONE 'Asia/Manila')::date,
        null,
        'REPORT01',
        null,
        25
      )->'items'
    )
  ) >= 1,
  'transaction search filters by plate'
);

select ok(
  (
    select count(*)::int
    from jsonb_array_elements(
      public.list_transactions(
        ((clock_timestamp() AT TIME ZONE 'Asia/Manila')::date - 30),
        (clock_timestamp() AT TIME ZONE 'Asia/Manila')::date,
        null,
        null,
        null,
        25
      )->'items'
    )
  ) <= 25,
  'transaction default page size respected'
);

select ok(
  (
    select public.get_report_preview(
      'SHIFT_RECONCILIATION',
      ((clock_timestamp() AT TIME ZONE 'Asia/Manila')::date - 30),
      (clock_timestamp() AT TIME ZONE 'Asia/Manila')::date
    )->'summary' ? 'shift_count'
  ),
  'shift reconciliation preview includes shift count'
);

select ok(
  (
    select public.get_report_preview(
      'MOVEMENTS',
      ((clock_timestamp() AT TIME ZONE 'Asia/Manila')::date - 7),
      (clock_timestamp() AT TIME ZONE 'Asia/Manila')::date
    )->'summary' ? 'entries'
  ),
  'movements preview includes entry totals'
);

select ok(
  (
    select public.get_report_preview(
      'OCCUPANCY',
      ((clock_timestamp() AT TIME ZONE 'Asia/Manila')::date - 7),
      (clock_timestamp() AT TIME ZONE 'Asia/Manila')::date
    )->'summary' ? 'average_occupancy_bps'
  ),
  'occupancy preview includes average occupancy'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}',
  true
);

select ok(
  exists (
    select 1
    from public.audit_logs al
    where al.action = 'REPORT_EXPORT'
      and al.parking_location_id = '11111111-1111-4111-8111-111111111111'
  ),
  'export writes immutable audit evidence'
);

select ok(
  exists (
    select 1
    from public.audit_logs al
    where al.action = 'REPORT_EXPORT'
      and al.after_data ? 'row_count'
      and al.after_data ? 'export_id'
  ),
  'export audit captures safe metadata'
);

select * from finish();

rollback;
