import { randomUUID } from 'node:crypto'

import type { ExitPreviewRequestInput, ExitPreviewResult, SettleCashAndExitRequestInput, SettleCashAndExitResult } from '@/features/exit/schemas'
import { centavosToString, parseCentavosString } from '@/lib/money/centavos'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export interface ExitPreviewActionResult {
  success: boolean
  error?: string
  code?: string
  data?: ExitPreviewResult
}

function mapExitPreviewRpcError(error: { message: string } | null): {
  message: string
  code?: string
} {
  if (!error) {
    return { message: 'Unable to calculate the exit preview.' }
  }

  const message = error.message.toUpperCase()

  if (message.includes('INVALID_STATUS_TRANSITION')) {
    return {
      message: 'This session is not ready for exit preview.',
      code: 'INVALID_STATUS_TRANSITION',
    }
  }

  if (message.includes('RATE_NOT_CONFIGURED')) {
    return {
      message: 'No rate snapshot is available for this session.',
      code: 'RATE_NOT_CONFIGURED',
    }
  }

  if (message.includes('IDEMPOTENCY_CONFLICT')) {
    return {
      message: 'This idempotency key was already used with different request data.',
      code: 'IDEMPOTENCY_CONFLICT',
    }
  }

  if (message.includes('AUTHENTICATION REQUIRED')) {
    return { message: 'Sign in is required.', code: 'AUTHENTICATION_REQUIRED' }
  }

  return { message: 'Unable to calculate the exit preview.' }
}

function mapRpcJsonToExitPreview(payload: Record<string, unknown>): ExitPreviewResult {
  return {
    session_id: String(payload.session_id),
    status: payload.status as ExitPreviewResult['status'],
    billed_minutes: Number(payload.billed_minutes),
    subtotal_centavos: centavosToString(BigInt(String(payload.subtotal_centavos))),
    discount_centavos: centavosToString(BigInt(String(payload.discount_centavos))),
    penalty_centavos: centavosToString(BigInt(String(payload.penalty_centavos))),
    adjustment_centavos: centavosToString(BigInt(String(payload.adjustment_centavos))),
    total_centavos: centavosToString(BigInt(String(payload.total_centavos))),
    fee_version: Number(payload.fee_version),
    quote_expires_at: String(payload.quote_expires_at),
  }
}

export async function calculateExitPreview(
  input: ExitPreviewRequestInput,
): Promise<ExitPreviewActionResult> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc('calculate_parking_exit', {
    p_session_id: input.session_id,
    p_idempotency_key: input.idempotency_key,
    p_correlation_id: input.correlation_id ?? randomUUID(),
  })

  if (error) {
    const mapped = mapExitPreviewRpcError(error)
    return {
      success: false,
      error: mapped.message,
      ...(mapped.code ? { code: mapped.code } : {}),
    }
  }

  if (!data || typeof data !== 'object') {
    return { success: false, error: 'Unable to calculate the exit preview.' }
  }

  return {
    success: true,
    data: mapRpcJsonToExitPreview(data as Record<string, unknown>),
  }
}

export interface ExitSessionFacts {
  sessionId: string
  ticketNumber: string
  displayPlateNumber: string
  vehicleType: string
  spaceCode: string
  entryTime: string
  status: string
  quoteExpiresAt: string | null
  quoteExpired: boolean
  totalCentavos: string | null
}

export async function getExitSessionFacts(
  sessionId: string,
): Promise<ExitSessionFacts | null> {
  const supabase = await createServerSupabaseClient()
  const { data: session, error: sessionError } = await supabase
    .from('parking_sessions')
    .select('id, status, entry_time, quote_expires_at, total_centavos, vehicle_id, parking_space_id')
    .eq('id', sessionId)
    .maybeSingle()

  if (sessionError || !session) {
    return null
  }

  const [{ data: vehicle }, { data: ticket }, spaceResult] = await Promise.all([
    supabase
      .from('vehicles')
      .select('display_plate_number, vehicle_type_id')
      .eq('id', session.vehicle_id)
      .maybeSingle(),
    supabase
      .from('parking_tickets')
      .select('ticket_number')
      .eq('parking_session_id', session.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    session.parking_space_id
      ? supabase
          .from('parking_spaces')
          .select('code')
          .eq('id', session.parking_space_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ])

  if (!vehicle || !ticket) {
    return null
  }

  const spaceCode = spaceResult.data?.code ?? 'Capacity pool'

  const { data: vehicleType } = await supabase
    .from('vehicle_types')
    .select('code')
    .eq('id', vehicle.vehicle_type_id)
    .maybeSingle()

  if (!vehicleType) {
    return null
  }

  return {
    sessionId: session.id,
    ticketNumber: ticket.ticket_number,
    displayPlateNumber: vehicle.display_plate_number,
    vehicleType: vehicleType.code,
    spaceCode,
    entryTime: session.entry_time,
    status: session.status,
    quoteExpiresAt: session.quote_expires_at,
    quoteExpired:
      session.quote_expires_at !== null &&
      new Date(session.quote_expires_at).getTime() < Date.now(),
    totalCentavos:
      session.total_centavos === null ? null : String(session.total_centavos),
  }
}

export interface SettleCashAndExitActionResult {
  success: boolean
  error?: string
  code?: string
  data?: SettleCashAndExitResult
}

function mapSettleRpcError(error: { message: string } | null): {
  message: string
  code?: string
} {
  if (!error) {
    return { message: 'Unable to settle and complete exit.' }
  }

  const message = error.message.toUpperCase()

  const mappings: Array<[string, string, string?]> = [
    ['INSUFFICIENT_CASH', 'Cash tendered is less than the amount due.', 'INSUFFICIENT_CASH'],
    ['PAYMENT_REQUIRED', 'Additional payment is required before exit.', 'PAYMENT_REQUIRED'],
    ['SESSION_CANCELLED', 'This session was cancelled.', 'SESSION_CANCELLED'],
    ['TICKET_ALREADY_COMPLETED', 'This session was already completed.', 'TICKET_ALREADY_COMPLETED'],
    ['INVALID_STATUS_TRANSITION', 'This session is not ready for checkout.', 'INVALID_STATUS_TRANSITION'],
    ['DUPLICATE_PAYMENT_REFERENCE', 'That payment reference was already used.', 'DUPLICATE_PAYMENT_REFERENCE'],
    ['RATE_NOT_CONFIGURED', 'No rate snapshot is available for this session.', 'RATE_NOT_CONFIGURED'],
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

  return { message: 'Unable to settle and complete exit.' }
}

function mapRpcJsonToSettleResult(payload: Record<string, unknown>): SettleCashAndExitResult {
  const nullableCentavos = (value: unknown): string | null =>
    value === null || value === undefined ? null : centavosToString(BigInt(String(value)))

  return {
    session_id: String(payload.session_id),
    exit_time: String(payload.exit_time),
    session_status: 'COMPLETED',
    released_space_id:
      payload.released_space_id === null || payload.released_space_id === undefined
        ? null
        : String(payload.released_space_id),
    payment_id:
      payload.payment_id === null || payload.payment_id === undefined
        ? null
        : String(payload.payment_id),
    receipt_number:
      payload.receipt_number === null || payload.receipt_number === undefined
        ? null
        : String(payload.receipt_number),
    amount_centavos: nullableCentavos(payload.amount_centavos),
    cash_tendered_centavos: nullableCentavos(payload.cash_tendered_centavos),
    change_centavos: nullableCentavos(payload.change_centavos),
  }
}

export async function settleCashAndExit(
  input: SettleCashAndExitRequestInput,
): Promise<SettleCashAndExitActionResult> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc('settle_cash_and_exit', {
    p_session_id: input.session_id,
    p_cash_tendered_centavos: Number(parseCentavosString(input.cash_tendered_centavos)),
    p_external_reference: input.external_reference ?? null,
    p_idempotency_key: input.idempotency_key,
    p_correlation_id: input.correlation_id ?? randomUUID(),
  })

  if (error) {
    const mapped = mapSettleRpcError(error)
    return {
      success: false,
      error: mapped.message,
      ...(mapped.code ? { code: mapped.code } : {}),
    }
  }

  if (!data || typeof data !== 'object') {
    return { success: false, error: 'Unable to settle and complete exit.' }
  }

  return {
    success: true,
    data: mapRpcJsonToSettleResult(data as Record<string, unknown>),
  }
}
