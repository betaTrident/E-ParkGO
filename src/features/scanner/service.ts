import { randomUUID } from 'node:crypto'

import type { TicketValidationRequestInput } from '@/features/scanner/schemas'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export interface TicketValidationResult {
  session_id: string
  ticket_number: string
  display_plate_number: string
  vehicle_type: string
  space_code: string
  entry_time: string
  status: string
}

export interface TicketValidationActionResult {
  success: boolean
  error?: string
  code?: string
  data?: TicketValidationResult
}

function mapValidationRpcError(error: { message: string } | null): {
  message: string
  code?: string
} {
  if (!error) {
    return { message: 'Unable to validate the ticket.' }
  }

  const message = error.message.toUpperCase()

  if (message.includes('TICKET_INVALID') || message.includes('WRONG_LOCATION')) {
    return { message: 'Ticket not found.', code: 'TICKET_INVALID' }
  }

  if (message.includes('TICKET_REVOKED')) {
    return { message: 'This ticket is no longer valid.', code: 'TICKET_REVOKED' }
  }

  if (message.includes('TICKET_ALREADY_COMPLETED')) {
    return {
      message: 'This ticket has already been completed.',
      code: 'TICKET_ALREADY_COMPLETED',
    }
  }

  if (message.includes('RATE_LIMITED')) {
    return {
      message: 'Too many scan attempts. Try again shortly.',
      code: 'RATE_LIMITED',
    }
  }

  if (message.includes('IDEMPOTENCY_CONFLICT')) {
    return {
      message: 'This idempotency key was already used with different request data.',
      code: 'IDEMPOTENCY_CONFLICT',
    }
  }

  if (message.includes('INVALID_STATUS_TRANSITION')) {
    return {
      message: 'This ticket cannot be reviewed in its current state.',
      code: 'INVALID_STATUS_TRANSITION',
    }
  }

  if (message.includes('AUTHENTICATION REQUIRED')) {
    return { message: 'Sign in is required.', code: 'AUTHENTICATION_REQUIRED' }
  }

  return { message: 'Unable to validate the ticket.' }
}

function mapRpcJsonToValidationResult(
  payload: Record<string, unknown>,
): TicketValidationResult {
  return {
    session_id: String(payload.session_id),
    ticket_number: String(payload.ticket_number),
    display_plate_number: String(payload.display_plate_number),
    vehicle_type: String(payload.vehicle_type),
    space_code: String(payload.space_code),
    entry_time: String(payload.entry_time),
    status: String(payload.status),
  }
}

export async function validateParkingTicket(
  input: TicketValidationRequestInput,
): Promise<TicketValidationActionResult> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc('validate_parking_ticket', {
    p_token: input.token ?? null,
    p_ticket_number: input.ticket_number ?? null,
    p_idempotency_key: input.idempotency_key,
    p_correlation_id: input.correlation_id ?? randomUUID(),
  })

  if (error) {
    const mapped = mapValidationRpcError(error)
    return {
      success: false,
      error: mapped.message,
      ...(mapped.code ? { code: mapped.code } : {}),
    }
  }

  if (!data || typeof data !== 'object') {
    return { success: false, error: 'Unable to validate the ticket.' }
  }

  return {
    success: true,
    data: mapRpcJsonToValidationResult(data as Record<string, unknown>),
  }
}
