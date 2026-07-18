-- Phase 3: extensions, enums, shared utilities, and private schema shell.

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA extensions;

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO postgres, service_role;

CREATE TYPE public.app_role AS ENUM ('ADMIN', 'STAFF');
CREATE TYPE public.space_status AS ENUM ('AVAILABLE', 'OCCUPIED', 'OUT_OF_SERVICE');
CREATE TYPE public.session_status AS ENUM (
  'ACTIVE',
  'EXIT_PENDING',
  'PAYMENT_PENDING',
  'PAID_AWAITING_EXIT',
  'COMPLETED',
  'CANCELLED',
  'LOST_TICKET',
  'MANUAL_REVIEW'
);
CREATE TYPE public.ticket_status AS ENUM ('ACTIVE', 'REVOKED', 'COMPLETED');
CREATE TYPE public.session_payment_status AS ENUM ('UNPAID', 'PAID', 'NOT_REQUIRED', 'VOIDED');
CREATE TYPE public.payment_kind AS ENUM ('COLLECTION', 'TOP_UP', 'REVERSAL');
CREATE TYPE public.rate_mode AS ENUM ('TIERED', 'FLAT');
CREATE TYPE public.shift_status AS ENUM ('OPEN', 'CLOSED');

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
