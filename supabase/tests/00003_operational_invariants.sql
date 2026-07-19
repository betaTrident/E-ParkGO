begin;

select plan(2);

set local role service_role;

insert into public.vehicles (
  id, parking_location_id, display_plate_number, normalized_plate_number,
  vehicle_type_id
) values (
  '66666666-6666-4666-8666-666666666661',
  '11111111-1111-4111-8111-111111111111',
  'ABC-1234', 'ABC1234',
  '33333333-3333-4333-8333-333333333331'
) on conflict do nothing;

insert into public.parking_sessions (
  id, parking_location_id, vehicle_id, parking_space_id, status,
  entry_processed_by
) values (
  '77777777-7777-4777-8777-777777777771',
  '11111111-1111-4111-8111-111111111111',
  '66666666-6666-4666-8666-666666666661',
  '44444444-4444-4444-8444-444444444441',
  'COMPLETED',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
) on conflict do nothing;

insert into public.payments (
  id, parking_session_id, parking_location_id, kind, amount_centavos,
  receipt_number, processed_by
) values (
  '88888888-8888-4888-8888-888888888881',
  '77777777-7777-4777-8777-777777777771',
  '11111111-1111-4111-8111-111111111111',
  'COLLECTION', 5000, 'EPG-TEST-0001',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
) on conflict do nothing;

select throws_ok(
  $$
    update public.payments
    set amount_centavos = 1
    where id = '88888888-8888-4888-8888-888888888881'
  $$,
  '42501',
  'Immutable table: UPDATE operations are not permitted',
  'payments are immutable'
);

insert into public.parking_sessions (
  id, parking_location_id, vehicle_id, parking_space_id, status,
  entry_processed_by
) values (
  '77777777-7777-4777-8777-777777777772',
  '11111111-1111-4111-8111-111111111111',
  '66666666-6666-4666-8666-666666666661',
  '44444444-4444-4444-8444-444444444442',
  'ACTIVE',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
) on conflict do nothing;

select throws_ok(
  $$
    insert into public.parking_sessions (
      parking_location_id, vehicle_id, parking_space_id, status,
      entry_processed_by
    ) values (
      '11111111-1111-4111-8111-111111111111',
      '66666666-6666-4666-8666-666666666661',
      '44444444-4444-4444-8444-444444444442',
      'ACTIVE',
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
    )
  $$,
  '23505',
  null,
  'duplicate occupying session per vehicle is rejected'
);

select * from finish();
rollback;
