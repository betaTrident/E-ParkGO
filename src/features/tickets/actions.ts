'use server'

import { randomUUID } from 'node:crypto'

import { revalidatePath } from 'next/cache'

import { reissueSchema } from '@/features/tickets/service'
import {
  getSessionIdForTicket,
  reissueParkingTicket,
} from '@/features/tickets/service'
import { requireActiveProfile } from '@/lib/auth/session'

export interface TicketActionState {
  success: boolean
  error: string | null
  qrPayload: string | null
  credentialRecovery: 'REISSUE_REQUIRED' | null
}

const initialState = (): TicketActionState => ({
  success: false,
  error: null,
  qrPayload: null,
  credentialRecovery: null,
})

export async function reissueTicketAction(
  ticketNumber: string,
  _prevState: TicketActionState,
  formData: FormData,
): Promise<TicketActionState> {
  const profile = await requireActiveProfile()
  const parsed = reissueSchema.safeParse({
    reason: formData.get('reason'),
    idempotency_key: formData.get('idempotencyKey'),
  })

  if (!parsed.success) {
    return {
      ...initialState(),
      error: parsed.error.issues[0]?.message ?? 'Invalid reissue request',
    }
  }

  const sessionId = await getSessionIdForTicket(ticketNumber, profile.parking_location_id)

  if (!sessionId) {
    return { ...initialState(), error: 'Ticket not found.' }
  }

  const result = await reissueParkingTicket(
    sessionId,
    profile.parking_location_id,
    {
      ...parsed.data,
      correlation_id: randomUUID(),
    },
  )

  if (!result.success || !result.data) {
    return {
      ...initialState(),
      error: result.error ?? 'Unable to reissue the ticket.',
    }
  }

  revalidatePath(`/tickets/${ticketNumber}`)

  return {
    success: true,
    error: null,
    qrPayload: result.data.qr_payload,
    credentialRecovery: result.data.credential_recovery ?? null,
  }
}
