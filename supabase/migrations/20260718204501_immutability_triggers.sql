-- Phase 3: immutability guards for append-only financial and audit evidence.

CREATE OR REPLACE FUNCTION public.prevent_mutation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  RAISE EXCEPTION 'Immutable table: % operations are not permitted', TG_OP
    USING ERRCODE = '42501';
END;
$$;

CREATE TRIGGER parking_rate_snapshots_immutable
  BEFORE UPDATE OR DELETE ON public.parking_rate_snapshots
  FOR EACH ROW EXECUTE FUNCTION public.prevent_mutation();

CREATE TRIGGER payments_immutable
  BEFORE UPDATE OR DELETE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.prevent_mutation();

CREATE TRIGGER receipts_immutable
  BEFORE UPDATE OR DELETE ON public.receipts
  FOR EACH ROW EXECUTE FUNCTION public.prevent_mutation();

CREATE TRIGGER session_corrections_immutable
  BEFORE UPDATE OR DELETE ON public.session_corrections
  FOR EACH ROW EXECUTE FUNCTION public.prevent_mutation();

CREATE TRIGGER audit_logs_immutable
  BEFORE UPDATE OR DELETE ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.prevent_mutation();
