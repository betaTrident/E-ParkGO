import { randomUUID } from 'node:crypto'

import type { CloseShiftRequestInput, StartShiftRequestInput } from '@/features/shifts/schemas'
import { parseCentavosString } from '@/lib/money/centavos'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export interface ShiftActionResult<T> {
  success: boolean
  error?: string
  code?: string
  data?: T
}

function mapShiftRpcError(error: { message: string } | null): {
  message: string
  code?: string
} {
  if (!error) {
    return { message: 'Unable to complete the shift action.' }
  }

  const message = error.message.toUpperCase()

  if (message.includes('INVALID_STATUS_TRANSITION')) {
    return { message: 'This shift cannot be updated in its current state.', code: 'INVALID_STATUS_TRANSITION' }
  }

  if (message.includes('IDEMPOTENCY_CONFLICT')) {
    return { message: 'This idempotency key was already used with different request data.', code: 'IDEMPOTENCY_CONFLICT' }
  }

  if (message.includes('AUTHENTICATION REQUIRED')) {
    return { message: 'Sign in is required.', code: 'AUTHENTICATION_REQUIRED' }
  }

  return { message: 'Unable to complete the shift action.' }
}

export async function startStaffShift(
  input: StartShiftRequestInput,
): Promise<ShiftActionResult<Record<string, unknown>>> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc('start_staff_shift', {
    p_device_id: input.device_id ?? null,
    p_opening_float_centavos: Number(parseCentavosString(input.opening_float_centavos)),
    p_idempotency_key: input.idempotency_key,
    p_correlation_id: input.correlation_id ?? randomUUID(),
  })

  if (error) {
    const mapped = mapShiftRpcError(error)
    return { success: false, error: mapped.message, ...(mapped.code ? { code: mapped.code } : {}) }
  }

  return { success: true, data: data as Record<string, unknown> }
}

export async function closeStaffShift(
  input: CloseShiftRequestInput,
): Promise<ShiftActionResult<Record<string, unknown>>> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc('close_staff_shift', {
    p_shift_id: input.shift_id,
    p_declared_cash_centavos: Number(parseCentavosString(input.declared_cash_centavos)),
    p_notes: input.notes ?? null,
    p_idempotency_key: input.idempotency_key,
    p_correlation_id: input.correlation_id ?? randomUUID(),
  })

  if (error) {
    const mapped = mapShiftRpcError(error)
    return { success: false, error: mapped.message, ...(mapped.code ? { code: mapped.code } : {}) }
  }

  return { success: true, data: data as Record<string, unknown> }
}

export async function getOpenShiftForActor() {
  const supabase = await createServerSupabaseClient()
  const { data: userData } = await supabase.auth.getUser()
  const userId = userData.user?.id
  if (!userId) {
    return null
  }

  const { data } = await supabase
    .from('staff_shifts')
    .select('id, status, opened_at, opening_float_centavos, expected_cash_centavos')
    .eq('profile_id', userId)
    .eq('status', 'OPEN')
    .order('opened_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return data
}
