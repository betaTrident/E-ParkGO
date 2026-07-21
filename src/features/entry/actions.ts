'use server'

import { randomUUID } from 'node:crypto'

import { revalidatePath } from 'next/cache'

import { entryFormSchema } from '@/features/entry/schemas'
import { createParkingEntry } from '@/features/entry/service'
import { requireActiveProfile } from '@/lib/auth/session'

export interface EntryActionState {
  success: boolean
  error: string | null
  ticketNumber: string | null
  qrPayload: string | null
  credentialRecovery: 'REISSUE_REQUIRED' | null
}

const initialState = (): EntryActionState => ({
  success: false,
  error: null,
  ticketNumber: null,
  qrPayload: null,
  credentialRecovery: null,
})

function toFormRecord(formData: FormData): Record<string, unknown> {
  return Object.fromEntries(formData.entries())
}

export async function createEntryAction(
  _prevState: EntryActionState,
  formData: FormData,
): Promise<EntryActionState> {
  await requireActiveProfile()

  const idempotencyKey = formData.get('idempotencyKey')
  const parsed = entryFormSchema.safeParse({
    plateNumber: formData.get('plateNumber'),
    vehicleTypeId: formData.get('vehicleTypeId'),
    color: formData.get('color') || undefined,
    parkingSpaceId: formData.get('parkingSpaceId'),
  })

  if (!parsed.success) {
    return {
      ...initialState(),
      error: parsed.error.issues[0]?.message ?? 'Invalid entry request',
    }
  }

  if (typeof idempotencyKey !== 'string' || !idempotencyKey) {
    return { ...initialState(), error: 'Idempotency key is required.' }
  }

  const forbidden = Object.keys(toFormRecord(formData)).some((key) =>
    ['actorId', 'locationId', 'entryTime', 'status', 'totalCentavos'].includes(key),
  )

  if (forbidden) {
    return { ...initialState(), error: 'Invalid entry request.' }
  }

  const result = await createParkingEntry({
    plate_number: parsed.data.plateNumber,
    vehicle_type_id: parsed.data.vehicleTypeId,
    color: parsed.data.color,
    parking_space_id: parsed.data.parkingSpaceId,
    idempotency_key: idempotencyKey,
    correlation_id: randomUUID(),
  })

  if (!result.success || !result.data) {
    return {
      ...initialState(),
      error: result.error ?? 'Unable to create the parking entry.',
    }
  }

  revalidatePath('/entry')
  revalidatePath('/spaces')
  revalidatePath(`/tickets/${result.data.ticket_number}`)

  return {
    success: true,
    error: null,
    ticketNumber: result.data.ticket_number,
    qrPayload: result.data.qr_payload,
    credentialRecovery: result.data.credential_recovery ?? null,
  }
}
