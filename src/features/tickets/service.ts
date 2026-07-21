import { randomUUID } from 'node:crypto'

import { z } from 'zod'

import { env } from '@/lib/env'
import { rewriteQrPayloadHost } from '@/lib/security/qr-token'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export interface TicketPrintFacts {
  ticket_number: string
  entry_time: string
  display_plate_number: string
  vehicle_type_code: string
  space_code: string
  zone_code: string
  status: string
  qr_payload: string | null
  credential_recovery?: 'REISSUE_REQUIRED'
}

export interface TicketActionResult {
  success: boolean
  error?: string
  data?: TicketPrintFacts
}

const reissueSchema = z
  .object({
    reason: z
      .string()
      .trim()
      .min(10, 'Reason must be at least 10 characters')
      .max(500, 'Reason is too long'),
    idempotency_key: z.uuid('Idempotency key is required'),
    correlation_id: z.uuid().optional(),
  })
  .strict()

export type TicketReissueInput = z.infer<typeof reissueSchema>

export { reissueSchema }

function mapTicketRpcError(error: { message: string } | null): string {
  if (!error) {
    return 'Unable to complete the ticket action.'
  }

  const message = error.message.toUpperCase()

  if (message.includes('TICKET_INVALID')) {
    return 'Ticket not found.'
  }

  if (message.includes('INVALID_STATUS_TRANSITION')) {
    return 'This ticket cannot be reissued in its current state.'
  }

  if (message.includes('IDEMPOTENCY_CONFLICT')) {
    return 'This idempotency key was already used with different request data.'
  }

  return 'Unable to complete the ticket action.'
}

export async function getTicketPrintFacts(
  ticketNumber: string,
  locationId: string,
): Promise<TicketPrintFacts | null> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('parking_tickets')
    .select(
      `
      ticket_number,
      status,
      parking_sessions!inner (
        entry_time,
        status,
        parking_location_id,
        vehicles!inner (display_plate_number, vehicle_types!inner (code)),
        parking_spaces!inner (code, parking_zones!inner (code))
      )
    `,
    )
    .eq('ticket_number', ticketNumber)
    .eq('parking_sessions.parking_location_id', locationId)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  const session = Array.isArray(data.parking_sessions)
    ? data.parking_sessions[0]
    : data.parking_sessions
  const vehicle = Array.isArray(session?.vehicles) ? session.vehicles[0] : session?.vehicles
  const vehicleType = Array.isArray(vehicle?.vehicle_types)
    ? vehicle.vehicle_types[0]
    : vehicle?.vehicle_types
  const space = Array.isArray(session?.parking_spaces)
    ? session.parking_spaces[0]
    : session?.parking_spaces
  const zone = Array.isArray(space?.parking_zones)
    ? space.parking_zones[0]
    : space?.parking_zones

  if (!session || !vehicle || !space || !zone) {
    return null
  }

  return {
    ticket_number: data.ticket_number,
    entry_time: session.entry_time,
    display_plate_number: vehicle.display_plate_number,
    vehicle_type_code: vehicleType?.code ?? '',
    space_code: space.code,
    zone_code: zone.code,
    status: data.status,
    qr_payload: null,
  }
}

export async function reissueParkingTicket(
  sessionId: string,
  locationId: string,
  input: TicketReissueInput,
): Promise<TicketActionResult> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc('reissue_parking_ticket', {
    p_session_id: sessionId,
    p_reason: input.reason,
    p_idempotency_key: input.idempotency_key,
    p_correlation_id: input.correlation_id ?? randomUUID(),
  })

  if (error) {
    return { success: false, error: mapTicketRpcError(error) }
  }

  if (!data || typeof data !== 'object') {
    return { success: false, error: 'Unable to reissue the ticket.' }
  }

  const payload = data as Record<string, unknown>
  const facts = await getTicketPrintFacts(String(payload.ticket_number), locationId)

  if (!facts) {
    return { success: false, error: 'Unable to load reissued ticket details.' }
  }

  return {
    success: true,
    data: {
      ...facts,
      qr_payload: rewriteQrPayloadHost(
        typeof payload.qr_payload === 'string' ? payload.qr_payload : null,
        env.NEXT_PUBLIC_APP_URL,
      ),
      ...(payload.credential_recovery === 'REISSUE_REQUIRED'
        ? { credential_recovery: 'REISSUE_REQUIRED' as const }
        : {}),
    },
  }
}

export async function getSessionIdForTicket(
  ticketNumber: string,
  locationId: string,
): Promise<string | null> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('parking_tickets')
    .select('parking_session_id, parking_sessions!inner(parking_location_id)')
    .eq('ticket_number', ticketNumber)
    .eq('parking_sessions.parking_location_id', locationId)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  return data.parking_session_id
}
