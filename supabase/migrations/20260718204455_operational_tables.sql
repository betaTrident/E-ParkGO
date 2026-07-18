-- Phase 3: vehicles, rates, sessions, tickets, payments, shifts, audit, idempotency.

CREATE TABLE public.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parking_location_id uuid NOT NULL REFERENCES public.parking_locations (id) ON DELETE RESTRICT,
  display_plate_number text NOT NULL,
  normalized_plate_number text NOT NULL,
  vehicle_type_id uuid NOT NULL,
  color text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (parking_location_id, normalized_plate_number),
  UNIQUE (id, parking_location_id),
  CONSTRAINT vehicles_display_plate_not_blank CHECK (btrim(display_plate_number) <> ''),
  CONSTRAINT vehicles_normalized_plate_not_blank CHECK (btrim(normalized_plate_number) <> ''),
  CONSTRAINT vehicles_normalized_plate_format CHECK (normalized_plate_number ~ '^[A-Z0-9]{2,12}$'),
  CONSTRAINT vehicles_vehicle_type_fk FOREIGN KEY (vehicle_type_id, parking_location_id)
    REFERENCES public.vehicle_types (id, parking_location_id) ON DELETE RESTRICT
);

CREATE TABLE public.parking_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parking_location_id uuid NOT NULL REFERENCES public.parking_locations (id) ON DELETE RESTRICT,
  vehicle_type_id uuid NULL,
  version integer NOT NULL,
  mode public.rate_mode NOT NULL,
  grace_minutes integer NOT NULL DEFAULT 0,
  initial_minutes integer NULL,
  initial_fee_centavos bigint NULL,
  succeeding_interval_minutes integer NULL,
  succeeding_fee_centavos bigint NULL,
  flat_fee_centavos bigint NULL,
  daily_max_centavos bigint NULL,
  overnight_fee_centavos bigint NOT NULL DEFAULT 0,
  lost_ticket_penalty_centavos bigint NOT NULL DEFAULT 0,
  effective_from timestamptz NOT NULL,
  effective_to timestamptz NULL,
  is_published boolean NOT NULL DEFAULT false,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, parking_location_id),
  UNIQUE NULLS NOT DISTINCT (parking_location_id, vehicle_type_id, version),
  CONSTRAINT parking_rates_version_positive CHECK (version > 0),
  CONSTRAINT parking_rates_grace_nonnegative CHECK (grace_minutes >= 0),
  CONSTRAINT parking_rates_effective_range CHECK (effective_to IS NULL OR effective_to > effective_from),
  CONSTRAINT parking_rates_vehicle_type_fk FOREIGN KEY (vehicle_type_id, parking_location_id)
    REFERENCES public.vehicle_types (id, parking_location_id) ON DELETE RESTRICT,
  CONSTRAINT parking_rates_created_by_fk FOREIGN KEY (created_by, parking_location_id)
    REFERENCES public.profiles (id, parking_location_id) ON DELETE RESTRICT
);

CREATE TABLE public.parking_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parking_location_id uuid NOT NULL REFERENCES public.parking_locations (id) ON DELETE RESTRICT,
  vehicle_id uuid NOT NULL,
  parking_space_id uuid NOT NULL,
  status public.session_status NOT NULL DEFAULT 'ACTIVE',
  payment_status public.session_payment_status NOT NULL DEFAULT 'UNPAID',
  entry_processed_by uuid NOT NULL,
  payment_processed_by uuid NULL,
  exit_processed_by uuid NULL,
  override_approved_by uuid NULL,
  entry_time timestamptz NOT NULL DEFAULT clock_timestamp(),
  exit_time timestamptz NULL,
  fee_calculated_at timestamptz NULL,
  quote_expires_at timestamptz NULL,
  total_minutes integer NULL,
  subtotal_centavos bigint NULL,
  discount_centavos bigint NULL,
  penalty_centavos bigint NULL,
  adjustment_centavos bigint NULL,
  total_centavos bigint NULL,
  version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, parking_location_id),
  CONSTRAINT parking_sessions_version_positive CHECK (version > 0),
  CONSTRAINT parking_sessions_money_nonnegative CHECK (
    (subtotal_centavos IS NULL OR subtotal_centavos >= 0)
    AND (discount_centavos IS NULL OR discount_centavos >= 0)
    AND (penalty_centavos IS NULL OR penalty_centavos >= 0)
    AND (total_centavos IS NULL OR total_centavos >= 0)
  ),
  CONSTRAINT parking_sessions_exit_after_entry CHECK (exit_time IS NULL OR exit_time >= entry_time),
  CONSTRAINT parking_sessions_vehicle_fk FOREIGN KEY (vehicle_id, parking_location_id)
    REFERENCES public.vehicles (id, parking_location_id) ON DELETE RESTRICT,
  CONSTRAINT parking_sessions_space_fk FOREIGN KEY (parking_space_id, parking_location_id)
    REFERENCES public.parking_spaces (id, parking_location_id) ON DELETE RESTRICT,
  CONSTRAINT parking_sessions_entry_processed_by_fk FOREIGN KEY (entry_processed_by, parking_location_id)
    REFERENCES public.profiles (id, parking_location_id) ON DELETE RESTRICT,
  CONSTRAINT parking_sessions_payment_processed_by_fk FOREIGN KEY (payment_processed_by, parking_location_id)
    REFERENCES public.profiles (id, parking_location_id) ON DELETE RESTRICT,
  CONSTRAINT parking_sessions_exit_processed_by_fk FOREIGN KEY (exit_processed_by, parking_location_id)
    REFERENCES public.profiles (id, parking_location_id) ON DELETE RESTRICT,
  CONSTRAINT parking_sessions_override_approved_by_fk FOREIGN KEY (override_approved_by, parking_location_id)
    REFERENCES public.profiles (id, parking_location_id) ON DELETE RESTRICT
);

CREATE TABLE public.parking_rate_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parking_location_id uuid NOT NULL,
  parking_session_id uuid NOT NULL UNIQUE,
  parking_rate_id uuid NOT NULL,
  rate_version integer NOT NULL,
  mode public.rate_mode NOT NULL,
  grace_minutes integer NOT NULL,
  initial_minutes integer NULL,
  initial_fee_centavos bigint NULL,
  succeeding_interval_minutes integer NULL,
  succeeding_fee_centavos bigint NULL,
  flat_fee_centavos bigint NULL,
  daily_max_centavos bigint NULL,
  overnight_fee_centavos bigint NOT NULL,
  lost_ticket_penalty_centavos bigint NOT NULL,
  snapshot_json jsonb NOT NULL,
  snapshot_hash bytea NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT parking_rate_snapshots_hash_length CHECK (octet_length(snapshot_hash) = 32),
  CONSTRAINT parking_rate_snapshots_session_fk FOREIGN KEY (parking_session_id, parking_location_id)
    REFERENCES public.parking_sessions (id, parking_location_id) ON DELETE RESTRICT,
  CONSTRAINT parking_rate_snapshots_rate_fk FOREIGN KEY (parking_rate_id, parking_location_id)
    REFERENCES public.parking_rates (id, parking_location_id) ON DELETE RESTRICT
);

CREATE TABLE public.parking_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parking_session_id uuid NOT NULL,
  parking_location_id uuid NOT NULL REFERENCES public.parking_locations (id) ON DELETE RESTRICT,
  ticket_number citext NOT NULL UNIQUE,
  qr_token_hash bytea NOT NULL UNIQUE,
  status public.ticket_status NOT NULL DEFAULT 'ACTIVE',
  reissue_of_ticket_id uuid NULL,
  issued_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  expires_at timestamptz NULL,
  reprint_count integer NOT NULL DEFAULT 0,
  last_reprinted_at timestamptz NULL,
  revoked_at timestamptz NULL,
  completed_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, parking_location_id),
  CONSTRAINT parking_tickets_hash_length CHECK (octet_length(qr_token_hash) = 32),
  CONSTRAINT parking_tickets_reprint_count_nonnegative CHECK (reprint_count >= 0),
  CONSTRAINT parking_tickets_session_fk FOREIGN KEY (parking_session_id, parking_location_id)
    REFERENCES public.parking_sessions (id, parking_location_id) ON DELETE RESTRICT,
  CONSTRAINT parking_tickets_reissue_fk FOREIGN KEY (reissue_of_ticket_id, parking_location_id)
    REFERENCES public.parking_tickets (id, parking_location_id) ON DELETE RESTRICT
);

CREATE TABLE public.staff_shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parking_location_id uuid NOT NULL REFERENCES public.parking_locations (id) ON DELETE RESTRICT,
  profile_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  device_id uuid NULL,
  status public.shift_status NOT NULL DEFAULT 'OPEN',
  opened_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  closed_at timestamptz NULL,
  opening_float_centavos bigint NOT NULL DEFAULT 0,
  expected_cash_centavos bigint NULL,
  declared_cash_centavos bigint NULL,
  variance_centavos bigint NULL,
  notes text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, parking_location_id),
  CONSTRAINT staff_shifts_opening_float_nonnegative CHECK (opening_float_centavos >= 0),
  CONSTRAINT staff_shifts_close_consistency CHECK (
    (status = 'OPEN' AND closed_at IS NULL)
    OR (status = 'CLOSED' AND closed_at IS NOT NULL)
  ),
  CONSTRAINT staff_shifts_profile_fk FOREIGN KEY (profile_id, parking_location_id)
    REFERENCES public.profiles (id, parking_location_id) ON DELETE RESTRICT,
  CONSTRAINT staff_shifts_device_fk FOREIGN KEY (device_id, parking_location_id)
    REFERENCES public.devices (id, parking_location_id) ON DELETE RESTRICT
);

CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parking_session_id uuid NOT NULL,
  parking_location_id uuid NOT NULL REFERENCES public.parking_locations (id) ON DELETE RESTRICT,
  staff_shift_id uuid NULL,
  kind public.payment_kind NOT NULL,
  amount_centavos bigint NOT NULL,
  cash_tendered_centavos bigint NULL,
  change_centavos bigint NULL,
  receipt_number citext NOT NULL UNIQUE,
  external_reference citext NULL,
  reverses_payment_id uuid NULL REFERENCES public.payments (id) ON DELETE RESTRICT,
  processed_by uuid NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  reason text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (parking_location_id, external_reference),
  UNIQUE (id, parking_location_id),
  CONSTRAINT payments_amount_positive CHECK (amount_centavos > 0),
  CONSTRAINT payments_cash_nonnegative CHECK (
    (cash_tendered_centavos IS NULL OR cash_tendered_centavos >= 0)
    AND (change_centavos IS NULL OR change_centavos >= 0)
  ),
  CONSTRAINT payments_session_fk FOREIGN KEY (parking_session_id, parking_location_id)
    REFERENCES public.parking_sessions (id, parking_location_id) ON DELETE RESTRICT,
  CONSTRAINT payments_shift_fk FOREIGN KEY (staff_shift_id, parking_location_id)
    REFERENCES public.staff_shifts (id, parking_location_id) ON DELETE RESTRICT,
  CONSTRAINT payments_processed_by_fk FOREIGN KEY (processed_by, parking_location_id)
    REFERENCES public.profiles (id, parking_location_id) ON DELETE RESTRICT,
  CONSTRAINT payments_reversal_fk FOREIGN KEY (reverses_payment_id, parking_location_id)
    REFERENCES public.payments (id, parking_location_id) ON DELETE RESTRICT
);

CREATE TABLE public.receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parking_location_id uuid NOT NULL REFERENCES public.parking_locations (id) ON DELETE RESTRICT,
  payment_id uuid NOT NULL,
  version integer NOT NULL DEFAULT 1,
  artifact_path text NULL,
  content_hash text NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  generated_by uuid NOT NULL,
  UNIQUE (payment_id, version),
  CONSTRAINT receipts_version_positive CHECK (version > 0),
  CONSTRAINT receipts_payment_fk FOREIGN KEY (payment_id, parking_location_id)
    REFERENCES public.payments (id, parking_location_id) ON DELETE RESTRICT,
  CONSTRAINT receipts_generated_by_fk FOREIGN KEY (generated_by, parking_location_id)
    REFERENCES public.profiles (id, parking_location_id) ON DELETE RESTRICT
);

CREATE TABLE public.session_corrections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parking_session_id uuid NOT NULL,
  parking_location_id uuid NOT NULL REFERENCES public.parking_locations (id) ON DELETE RESTRICT,
  correction_type text NOT NULL,
  before_data jsonb NOT NULL,
  after_data jsonb NOT NULL,
  reason text NOT NULL,
  requested_by uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  approved_by uuid NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  correlation_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  CONSTRAINT session_corrections_reason_length CHECK (char_length(reason) BETWEEN 10 AND 500),
  CONSTRAINT session_corrections_session_fk FOREIGN KEY (parking_session_id, parking_location_id)
    REFERENCES public.parking_sessions (id, parking_location_id) ON DELETE RESTRICT
);

CREATE TABLE public.audit_logs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  parking_location_id uuid NOT NULL REFERENCES public.parking_locations (id) ON DELETE RESTRICT,
  actor_id uuid NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id uuid NULL,
  result text NOT NULL,
  reason text NULL,
  correlation_id uuid NOT NULL,
  request_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  before_data jsonb NULL,
  after_data jsonb NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE public.idempotency_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  parking_location_id uuid NOT NULL REFERENCES public.parking_locations (id) ON DELETE RESTRICT,
  operation text NOT NULL,
  key uuid NOT NULL,
  request_hash bytea NOT NULL,
  resource_id uuid NULL,
  response_json jsonb NULL,
  status text NOT NULL,
  locked_until timestamptz NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (actor_id, operation, key),
  CONSTRAINT idempotency_keys_actor_location_fk FOREIGN KEY (actor_id, parking_location_id)
    REFERENCES public.profiles (id, parking_location_id) ON DELETE RESTRICT
);

CREATE TABLE public.rate_limit_buckets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  parking_location_id uuid NOT NULL REFERENCES public.parking_locations (id) ON DELETE RESTRICT,
  operation text NOT NULL,
  bucket_start timestamptz NOT NULL,
  request_count integer NOT NULL DEFAULT 0,
  blocked_until timestamptz NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (actor_id, operation, bucket_start),
  CONSTRAINT rate_limit_buckets_request_count_nonnegative CHECK (request_count >= 0),
  CONSTRAINT rate_limit_buckets_actor_location_fk FOREIGN KEY (actor_id, parking_location_id)
    REFERENCES public.profiles (id, parking_location_id) ON DELETE RESTRICT
);

CREATE TRIGGER vehicles_set_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER parking_rates_set_updated_at
  BEFORE UPDATE ON public.parking_rates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER parking_sessions_set_updated_at
  BEFORE UPDATE ON public.parking_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER staff_shifts_set_updated_at
  BEFORE UPDATE ON public.staff_shifts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER idempotency_keys_set_updated_at
  BEFORE UPDATE ON public.idempotency_keys
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER rate_limit_buckets_set_updated_at
  BEFORE UPDATE ON public.rate_limit_buckets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
