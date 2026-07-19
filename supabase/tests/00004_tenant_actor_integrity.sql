begin;

select plan(3);

insert into public.parking_locations (
  id, code, name, receipt_prefix
) values (
  '99999999-9999-4999-8999-999999999994',
  'INTEGRITY', 'Integrity Test Facility', 'INT'
);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'integrity@example.invalid', '', now(),
  '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
);

insert into public.profiles (
  id, parking_location_id, role, full_name
) values (
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  '99999999-9999-4999-8999-999999999994',
  'ADMIN', 'Cross-location Actor'
);

insert into public.vehicles (
  id, parking_location_id, display_plate_number, normalized_plate_number,
  vehicle_type_id
) values (
  '66666666-6666-4666-8666-666666666664',
  '11111111-1111-4111-8111-111111111111',
  'TEN-4004', 'TEN4004',
  '33333333-3333-4333-8333-333333333331'
);

insert into public.parking_sessions (
  id, parking_location_id, vehicle_id, parking_space_id, status,
  entry_processed_by
) values (
  '77777777-7777-4777-8777-777777777774',
  '11111111-1111-4111-8111-111111111111',
  '66666666-6666-4666-8666-666666666664',
  '44444444-4444-4444-8444-444444444441',
  'COMPLETED',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
);

select throws_ok(
  $$
    insert into public.session_corrections (
      parking_session_id, parking_location_id, correction_type, before_data,
      after_data, reason, requested_by, correlation_id
    ) values (
      '77777777-7777-4777-8777-777777777774',
      '11111111-1111-4111-8111-111111111111',
      'ENTRY_TIME', '{}'::jsonb, '{}'::jsonb,
      'Cross-location requester must be rejected',
      'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
      'f0000000-0000-4000-8000-000000000001'
    )
  $$,
  '23503',
  null,
  'cross-location correction requester is rejected'
);

select throws_ok(
  $$
    insert into public.session_corrections (
      parking_session_id, parking_location_id, correction_type, before_data,
      after_data, reason, requested_by, approved_by, correlation_id
    ) values (
      '77777777-7777-4777-8777-777777777774',
      '11111111-1111-4111-8111-111111111111',
      'ENTRY_TIME', '{}'::jsonb, '{}'::jsonb,
      'Cross-location approver must be rejected',
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
      'f0000000-0000-4000-8000-000000000002'
    )
  $$,
  '23503',
  null,
  'cross-location correction approver is rejected'
);

select throws_ok(
  $$
    insert into public.audit_logs (
      parking_location_id, actor_id, action, target_type, result,
      correlation_id
    ) values (
      '11111111-1111-4111-8111-111111111111',
      'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
      'INTEGRITY_TEST', 'parking_session', 'REJECTED',
      'f0000000-0000-4000-8000-000000000003'
    )
  $$,
  '23503',
  null,
  'cross-location audit actor is rejected'
);

select * from finish();
rollback;
