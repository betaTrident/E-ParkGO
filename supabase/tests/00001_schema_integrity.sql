begin;

select plan(20);

select ok(
  to_regclass('public.parking_locations') is not null,
  'parking_locations exists'
);
select ok(
  to_regclass('public.profiles') is not null,
  'profiles exists'
);
select ok(
  to_regclass('public.staff_permissions') is not null,
  'staff_permissions exists'
);
select ok(
  to_regclass('public.parking_sessions') is not null,
  'parking_sessions exists'
);
select ok(
  to_regclass('public.parking_tickets') is not null,
  'parking_tickets exists'
);
select ok(
  to_regclass('public.payments') is not null,
  'payments exists'
);
select ok(
  to_regclass('public.audit_logs') is not null,
  'audit_logs exists'
);
select ok(
  to_regclass('public.idempotency_keys') is not null,
  'idempotency_keys exists'
);

select ok(
  to_regtype('public.app_role') is not null,
  'app_role enum exists'
);
select ok(
  to_regtype('public.session_status') is not null,
  'session_status enum exists'
);
select ok(
  to_regtype('public.space_status') is not null,
  'space_status enum exists'
);

select ok(
  (
    select c.relrowsecurity
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'profiles'
  ),
  'profiles has RLS enabled'
);

select ok(
  (
    select count(*) > 0
    from pg_policies
    where schemaname = 'public' and tablename = 'profiles'
  ),
  'profiles has at least one policy'
);

select ok(
  (
    select c.relrowsecurity
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'payments'
  ),
  'payments has RLS enabled'
);

select ok(
  to_regclass('public.one_occupying_session_per_vehicle') is not null,
  'one_occupying_session_per_vehicle index exists'
);

select ok(
  to_regclass('public.one_occupying_session_per_space') is not null,
  'one_occupying_session_per_space index exists'
);

select ok(
  exists (
    select 1
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'payments'
      and t.tgname = 'payments_immutable'
      and not t.tgisinternal
  ),
  'payments_immutable trigger exists'
);

select ok(
  exists (
    select 1
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'audit_logs'
      and t.tgname = 'audit_logs_immutable'
      and not t.tgisinternal
  ),
  'audit_logs_immutable trigger exists'
);

select ok(
  to_regprocedure('private.current_location_id()') is not null,
  'private.current_location_id exists'
);

select ok(
  (
    select exists (
      select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'private'
        and p.proname = 'current_location_id'
        and exists (
          select 1
          from unnest(coalesce(p.proconfig, array[]::text[])) as cfg(setting)
          where setting like 'search_path=%'
        )
    )
  ),
  'current_location_id uses empty search_path'
);

select * from finish();
rollback;
