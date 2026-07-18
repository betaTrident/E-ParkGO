-- Phase 3: rate mode checks, exclusion/partial indexes, and query indexes.

ALTER TABLE public.parking_rates
  ADD CONSTRAINT parking_rates_mode_tiered_fields CHECK (
    mode <> 'TIERED'
    OR (
      initial_minutes IS NOT NULL
      AND initial_fee_centavos IS NOT NULL
      AND succeeding_interval_minutes IS NOT NULL
      AND succeeding_fee_centavos IS NOT NULL
      AND initial_minutes > 0
      AND succeeding_interval_minutes > 0
      AND initial_fee_centavos >= 0
      AND succeeding_fee_centavos >= 0
    )
  ),
  ADD CONSTRAINT parking_rates_mode_flat_fields CHECK (
    mode <> 'FLAT'
    OR (flat_fee_centavos IS NOT NULL AND flat_fee_centavos >= 0)
  ),
  ADD CONSTRAINT parking_rates_money_nonnegative CHECK (
    grace_minutes >= 0
    AND overnight_fee_centavos >= 0
    AND lost_ticket_penalty_centavos >= 0
    AND (daily_max_centavos IS NULL OR daily_max_centavos >= 0)
  );

ALTER TABLE public.parking_rates
  ADD CONSTRAINT no_overlapping_published_rates
  EXCLUDE USING gist (
    parking_location_id WITH =,
    (COALESCE(vehicle_type_id, '00000000-0000-0000-0000-000000000000'::uuid)) WITH =,
    (tstzrange(effective_from, COALESCE(effective_to, 'infinity'::timestamptz), '[)')) WITH &&
  )
  WHERE (is_published);

CREATE UNIQUE INDEX one_occupying_session_per_vehicle
  ON public.parking_sessions (parking_location_id, vehicle_id)
  WHERE status IN (
    'ACTIVE', 'EXIT_PENDING', 'PAYMENT_PENDING',
    'PAID_AWAITING_EXIT', 'LOST_TICKET', 'MANUAL_REVIEW'
  );

CREATE UNIQUE INDEX one_occupying_session_per_space
  ON public.parking_sessions (parking_location_id, parking_space_id)
  WHERE status IN (
    'ACTIVE', 'EXIT_PENDING', 'PAYMENT_PENDING',
    'PAID_AWAITING_EXIT', 'LOST_TICKET', 'MANUAL_REVIEW'
  );

CREATE UNIQUE INDEX one_open_shift_per_staff_location
  ON public.staff_shifts (parking_location_id, profile_id)
  WHERE status = 'OPEN';

CREATE UNIQUE INDEX one_active_ticket_per_session
  ON public.parking_tickets (parking_session_id)
  WHERE status = 'ACTIVE';

CREATE UNIQUE INDEX unique_external_payment_reference
  ON public.payments (parking_location_id, external_reference)
  WHERE external_reference IS NOT NULL;

CREATE UNIQUE INDEX one_reversal_per_payment
  ON public.payments (reverses_payment_id)
  WHERE kind = 'REVERSAL';

CREATE INDEX parking_sessions_location_status_entry_idx
  ON public.parking_sessions (parking_location_id, status, entry_time DESC);

CREATE INDEX parking_sessions_location_exit_idx
  ON public.parking_sessions (parking_location_id, exit_time DESC)
  WHERE exit_time IS NOT NULL;

CREATE INDEX parking_tickets_ticket_number_idx
  ON public.parking_tickets (ticket_number);

CREATE INDEX parking_tickets_qr_token_hash_idx
  ON public.parking_tickets (qr_token_hash);

CREATE INDEX vehicles_location_normalized_plate_idx
  ON public.vehicles (parking_location_id, normalized_plate_number);

CREATE INDEX parking_spaces_location_status_zone_idx
  ON public.parking_spaces (parking_location_id, status, zone_id);

CREATE INDEX payments_location_processed_at_idx
  ON public.payments (parking_location_id, processed_at DESC);

CREATE INDEX payments_session_idx
  ON public.payments (parking_session_id);

CREATE INDEX audit_logs_location_created_at_idx
  ON public.audit_logs (parking_location_id, created_at DESC);

CREATE INDEX audit_logs_actor_action_idx
  ON public.audit_logs (actor_id, action);

CREATE INDEX audit_logs_correlation_id_idx
  ON public.audit_logs (correlation_id);
