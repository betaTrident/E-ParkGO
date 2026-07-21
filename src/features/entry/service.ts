import { randomUUID } from 'node:crypto'

import type { EntryRequestInput } from '@/features/entry/schemas'
import { env } from '@/lib/env'
import { rewriteQrPayloadHost } from '@/lib/security/qr-token'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export interface EntryResult {
  session_id: string
  ticket_id: string
  ticket_number: string
  qr_payload: string | null
  entry_time: string
  status: 'ACTIVE'
  credential_recovery?: 'REISSUE_REQUIRED'
}

export interface EntryActionResult {
  success: boolean
  error?: string
  data?: EntryResult
}

function mapEntryRpcError(error: { message: string } | null): string {
  if (!error) {
    return 'Unable to create the parking entry.'
  }

  const message = error.message.toUpperCase()

  if (message.includes('ACTIVE_SESSION_EXISTS')) {
    return 'This vehicle already has an active parking session.'
  }

  if (message.includes('SPACE_NOT_AVAILABLE')) {
    return 'The selected space is not available.'
  }

  if (message.includes('RATE_NOT_CONFIGURED')) {
    return 'No published rate is configured for this vehicle type.'
  }

  if (message.includes('IDEMPOTENCY_CONFLICT')) {
    return 'This idempotency key was already used with different request data.'
  }

  if (message.includes('AUTHENTICATION REQUIRED')) {
    return 'Sign in is required.'
  }

  return 'Unable to create the parking entry.'
}

function mapRpcJsonToEntryResult(payload: Record<string, unknown>): EntryResult {
  const result: EntryResult = {
    session_id: String(payload.session_id),
    ticket_id: String(payload.ticket_id),
    ticket_number: String(payload.ticket_number),
    qr_payload: rewriteQrPayloadHost(
      typeof payload.qr_payload === 'string' ? payload.qr_payload : null,
      env.NEXT_PUBLIC_APP_URL,
    ),
    entry_time: String(payload.entry_time),
    status: 'ACTIVE',
  }

  if (payload.credential_recovery === 'REISSUE_REQUIRED') {
    result.credential_recovery = 'REISSUE_REQUIRED'
  }

  return result
}

export async function createParkingEntry(
  input: EntryRequestInput,
): Promise<EntryActionResult> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc('create_parking_entry', {
    p_plate: input.plate_number,
    p_vehicle_type_id: input.vehicle_type_id,
    p_color: input.color ?? null,
    p_space_id: input.parking_space_id,
    p_idempotency_key: input.idempotency_key,
    p_correlation_id: input.correlation_id ?? randomUUID(),
  })

  if (error) {
    return { success: false, error: mapEntryRpcError(error) }
  }

  if (!data || typeof data !== 'object') {
    return { success: false, error: 'Unable to create the parking entry.' }
  }

  return {
    success: true,
    data: mapRpcJsonToEntryResult(data as Record<string, unknown>),
  }
}
