-- Phase 3 hardening: enforce tenant ownership for correction and audit actors.
--
-- Add and validate the stronger composite foreign keys before removing the
-- legacy identity-only keys, so existing environments fail safely if they
-- already contain cross-location data.

ALTER TABLE public.session_corrections
  ADD CONSTRAINT session_corrections_requested_by_location_fk
    FOREIGN KEY (requested_by, parking_location_id)
    REFERENCES public.profiles (id, parking_location_id)
    ON DELETE RESTRICT
    NOT VALID,
  ADD CONSTRAINT session_corrections_approved_by_location_fk
    FOREIGN KEY (approved_by, parking_location_id)
    REFERENCES public.profiles (id, parking_location_id)
    ON DELETE RESTRICT
    NOT VALID;

ALTER TABLE public.audit_logs
  ADD CONSTRAINT audit_logs_actor_location_fk
    FOREIGN KEY (actor_id, parking_location_id)
    REFERENCES public.profiles (id, parking_location_id)
    ON DELETE RESTRICT
    NOT VALID;

ALTER TABLE public.session_corrections
  VALIDATE CONSTRAINT session_corrections_requested_by_location_fk,
  VALIDATE CONSTRAINT session_corrections_approved_by_location_fk;

ALTER TABLE public.audit_logs
  VALIDATE CONSTRAINT audit_logs_actor_location_fk;

ALTER TABLE public.session_corrections
  DROP CONSTRAINT session_corrections_requested_by_fkey,
  DROP CONSTRAINT session_corrections_approved_by_fkey;

ALTER TABLE public.audit_logs
  DROP CONSTRAINT audit_logs_actor_id_fkey;

CREATE INDEX session_corrections_requested_by_location_idx
  ON public.session_corrections (requested_by, parking_location_id);

CREATE INDEX session_corrections_approved_by_location_idx
  ON public.session_corrections (approved_by, parking_location_id)
  WHERE approved_by IS NOT NULL;

CREATE INDEX audit_logs_actor_location_idx
  ON public.audit_logs (actor_id, parking_location_id)
  WHERE actor_id IS NOT NULL;
