'use server'

import { revalidatePath } from 'next/cache'

import {
  closeShiftRequestSchema,
  startShiftRequestSchema,
} from '@/features/shifts/schemas'
import { closeStaffShift, startStaffShift } from '@/features/shifts/service'

export interface ShiftActionState {
  success: boolean
  error: string | null
}

const initialState: ShiftActionState = {
  success: false,
  error: null,
}

export async function startShiftAction(
  _previousState: ShiftActionState,
  formData: FormData,
): Promise<ShiftActionState> {
  const openingFloat = formData.get('opening_float_centavos')
  const idempotencyKey = formData.get('idempotency_key')
  const correlationId = formData.get('correlation_id')

  const parsed = startShiftRequestSchema.safeParse({
    opening_float_centavos: openingFloat,
    idempotency_key: idempotencyKey,
    correlation_id: typeof correlationId === 'string' ? correlationId : undefined,
  })

  if (!parsed.success) {
    return { ...initialState, error: 'Invalid shift start request.' }
  }

  const result = await startStaffShift(parsed.data)
  if (!result.success) {
    return {
      ...initialState,
      error: 'error' in result ? result.error ?? 'Unable to start shift.' : 'Unable to start shift.',
    }
  }

  revalidatePath('/shifts')
  return { success: true, error: null }
}

export async function closeShiftAction(
  _previousState: ShiftActionState,
  formData: FormData,
): Promise<ShiftActionState> {
  const shiftId = formData.get('shift_id')
  const declaredCash = formData.get('declared_cash_centavos')
  const notes = formData.get('notes')
  const idempotencyKey = formData.get('idempotency_key')
  const correlationId = formData.get('correlation_id')

  const parsed = closeShiftRequestSchema.safeParse({
    shift_id: shiftId,
    declared_cash_centavos: declaredCash,
    notes: typeof notes === 'string' && notes.length > 0 ? notes : undefined,
    idempotency_key: idempotencyKey,
    correlation_id: typeof correlationId === 'string' ? correlationId : undefined,
  })

  if (!parsed.success) {
    return { ...initialState, error: 'Invalid shift close request.' }
  }

  const result = await closeStaffShift(parsed.data)
  if (!result.success) {
    return {
      ...initialState,
      error: 'error' in result ? result.error ?? 'Unable to close shift.' : 'Unable to close shift.',
    }
  }

  revalidatePath('/shifts')
  return { success: true, error: null }
}
