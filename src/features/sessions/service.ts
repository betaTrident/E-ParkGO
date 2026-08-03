import { randomUUID } from 'node:crypto'

import type {
  CancelSessionRequestInput,
  CorrectionRequestInput,
  LostTicketRequestInput,
  VoidPaymentRequestInput,
} from '@/features/sessions/schemas'
import { createServerSupabaseClient } from '@/lib/supabase/server'

function mapExceptionRpcError(error: { message: string } | null): {
  message: string
  code?: string
} {
  if (!error) {
    return { message: 'Unable to complete the exception action.' }
  }

  const message = error.message.toUpperCase()

  if (message.includes('INSUFFICIENT_PERMISSION')) {
    return { message: 'You do not have permission for this action.', code: 'INSUFFICIENT_PERMISSION' }
  }

  if (message.includes('PAYMENT_REQUIRED')) {
    return { message: 'Financial evidence exists; use correction instead.', code: 'PAYMENT_REQUIRED' }
  }

  if (message.includes('INVALID_STATUS_TRANSITION')) {
    return { message: 'This session cannot accept that exception.', code: 'INVALID_STATUS_TRANSITION' }
  }

  if (message.includes('IDEMPOTENCY_CONFLICT')) {
    return { message: 'This idempotency key was already used with different request data.', code: 'IDEMPOTENCY_CONFLICT' }
  }

  return { message: 'Unable to complete the exception action.' }
}

export async function processLostTicket(sessionId: string, input: LostTicketRequestInput) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc('process_lost_ticket', {
    p_session_id: sessionId,
    p_evidence: input.evidence,
    p_reason: input.reason,
    p_idempotency_key: input.idempotency_key,
    p_correlation_id: input.correlation_id ?? randomUUID(),
  })

  if (error) {
    const mapped = mapExceptionRpcError(error)
    return {
      success: false,
      error: mapped.message,
      ...(mapped.code ? { code: mapped.code } : {}),
    }
  }

  return { success: true, data }
}

export async function cancelParkingSession(sessionId: string, input: CancelSessionRequestInput) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc('cancel_parking_session', {
    p_session_id: sessionId,
    p_reason: input.reason,
    p_idempotency_key: input.idempotency_key,
    p_correlation_id: input.correlation_id ?? randomUUID(),
  })

  if (error) {
    const mapped = mapExceptionRpcError(error)
    return { success: false, error: mapped.message, ...(mapped.code ? { code: mapped.code } : {}) }
  }

  return { success: true, data }
}

export async function correctParkingSession(sessionId: string, input: CorrectionRequestInput) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc('correct_parking_session', {
    p_session_id: sessionId,
    p_correction_type: input.correction_type,
    p_values: input.values,
    p_reason: input.reason,
    p_idempotency_key: input.idempotency_key,
    p_correlation_id: input.correlation_id ?? randomUUID(),
  })

  if (error) {
    const mapped = mapExceptionRpcError(error)
    return {
      success: false,
      error: mapped.message,
      ...(mapped.code ? { code: mapped.code } : {}),
    }
  }

  return { success: true, data }
}

export async function voidParkingPayment(paymentId: string, input: VoidPaymentRequestInput) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc('void_parking_payment', {
    p_payment_id: paymentId,
    p_reason: input.reason,
    p_idempotency_key: input.idempotency_key,
    p_correlation_id: input.correlation_id ?? randomUUID(),
  })

  if (error) {
    const mapped = mapExceptionRpcError(error)
    return {
      success: false,
      error: mapped.message,
      ...(mapped.code ? { code: mapped.code } : {}),
    }
  }

  return { success: true, data }
}

export async function listExceptionSessions() {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('parking_sessions')
    .select('id, status, entry_time, total_centavos, vehicles(display_plate_number), parking_tickets(ticket_number)')
    .in('status', ['PAYMENT_PENDING', 'PAID_AWAITING_EXIT', 'LOST_TICKET', 'MANUAL_REVIEW'])
    .order('entry_time', { ascending: false })
    .limit(50)

  return data ?? []
}
