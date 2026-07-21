import { randomUUID } from 'node:crypto'

import type {
  ExitConfirmationRequestInput,
  PaymentRequestInput,
} from '@/features/payments/schemas'
import { centavosToString, parseCentavosString } from '@/lib/money/centavos'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export interface PaymentActionResult<T> {
  success: boolean
  error?: string
  code?: string
  data?: T
}

function mapPaymentRpcError(error: { message: string } | null): {
  message: string
  code?: string
} {
  if (!error) {
    return { message: 'Unable to record the payment.' }
  }

  const message = error.message.toUpperCase()

  const mappings: Array<[string, string, string?]> = [
    ['QUOTE_EXPIRED', 'The fee quote has expired. Refresh and try again.', 'QUOTE_EXPIRED'],
    ['INSUFFICIENT_CASH', 'Cash tendered is less than the amount due.', 'INSUFFICIENT_CASH'],
    ['PAYMENT_ALREADY_RECORDED', 'Payment was already recorded for this session.', 'PAYMENT_ALREADY_RECORDED'],
    ['SESSION_CANCELLED', 'This session was cancelled.', 'SESSION_CANCELLED'],
    ['SHIFT_REQUIRED', 'Open a cash shift before recording payments.', 'SHIFT_REQUIRED'],
    ['DUPLICATE_PAYMENT_REFERENCE', 'That payment reference was already used.', 'DUPLICATE_PAYMENT_REFERENCE'],
    ['PAYMENT_REQUIRED', 'Additional payment is required before exit.', 'PAYMENT_REQUIRED'],
    ['INVALID_STATUS_TRANSITION', 'This session is not ready for payment.', 'INVALID_STATUS_TRANSITION'],
    ['IDEMPOTENCY_CONFLICT', 'This idempotency key was already used with different request data.', 'IDEMPOTENCY_CONFLICT'],
  ]

  for (const [needle, human, code] of mappings) {
    if (message.includes(needle)) {
      return code ? { message: human, code } : { message: human }
    }
  }

  if (message.includes('AUTHENTICATION REQUIRED')) {
    return { message: 'Sign in is required.', code: 'AUTHENTICATION_REQUIRED' }
  }

  return { message: 'Unable to complete the payment action.' }
}

export async function recordParkingPayment(input: PaymentRequestInput) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc('record_parking_payment', {
    p_session_id: input.session_id,
    p_cash_tendered_centavos: Number(parseCentavosString(input.cash_tendered_centavos)),
    p_external_reference: input.external_reference ?? null,
    p_idempotency_key: input.idempotency_key,
    p_correlation_id: input.correlation_id ?? randomUUID(),
  })

  if (error) {
    const mapped = mapPaymentRpcError(error)
    return { success: false, error: mapped.message, ...(mapped.code ? { code: mapped.code } : {}) }
  }

  if (!data || typeof data !== 'object') {
    return { success: false, error: 'Unable to record the payment.' }
  }

  const payload = data as Record<string, unknown>
  return {
    success: true,
    data: {
      payment_id: String(payload.payment_id),
      receipt_number: String(payload.receipt_number),
      amount_centavos: centavosToString(BigInt(String(payload.amount_centavos))),
      cash_tendered_centavos: centavosToString(BigInt(String(payload.cash_tendered_centavos))),
      change_centavos: centavosToString(BigInt(String(payload.change_centavos))),
      session_status: 'PAID_AWAITING_EXIT' as const,
    },
  }
}

export async function confirmVehicleExit(input: ExitConfirmationRequestInput) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc('confirm_vehicle_exit', {
    p_session_id: input.session_id,
    p_idempotency_key: input.idempotency_key,
    p_correlation_id: input.correlation_id ?? randomUUID(),
  })

  if (error) {
    const mapped = mapPaymentRpcError(error)
    return { success: false, error: mapped.message, ...(mapped.code ? { code: mapped.code } : {}) }
  }

  if (!data || typeof data !== 'object') {
    return { success: false, error: 'Unable to confirm exit.' }
  }

  const payload = data as Record<string, unknown>
  return {
    success: true,
    data: {
      session_id: String(payload.session_id),
      exit_time: String(payload.exit_time),
      status: 'COMPLETED' as const,
      released_space_id: String(payload.released_space_id),
    },
  }
}

export interface PaymentSessionFacts {
  sessionId: string
  ticketNumber: string
  displayPlateNumber: string
  status: string
  totalCentavos: string | null
  quoteExpiresAt: string | null
}

export async function getPaymentSessionFacts(
  sessionId: string,
): Promise<PaymentSessionFacts | null> {
  const supabase = await createServerSupabaseClient()
  const { data: session } = await supabase
    .from('parking_sessions')
    .select('id, status, total_centavos, quote_expires_at, vehicle_id')
    .eq('id', sessionId)
    .maybeSingle()

  if (!session) {
    return null
  }

  const [{ data: vehicle }, { data: ticket }] = await Promise.all([
    supabase
      .from('vehicles')
      .select('display_plate_number')
      .eq('id', session.vehicle_id)
      .maybeSingle(),
    supabase
      .from('parking_tickets')
      .select('ticket_number')
      .eq('parking_session_id', session.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  if (!vehicle || !ticket) {
    return null
  }

  return {
    sessionId: session.id,
    ticketNumber: ticket.ticket_number,
    displayPlateNumber: vehicle.display_plate_number,
    status: session.status,
    totalCentavos: session.total_centavos === null ? null : String(session.total_centavos),
    quoteExpiresAt: session.quote_expires_at,
  }
}
