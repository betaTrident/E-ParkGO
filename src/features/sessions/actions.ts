'use server'

import { revalidatePath } from 'next/cache'

import {
  cancelSessionRequestSchema,
  correctionRequestSchema,
  lostTicketRequestSchema,
} from '@/features/sessions/schemas'
import {
  cancelParkingSession,
  correctParkingSession,
  processLostTicket,
} from '@/features/sessions/service'

export interface ExceptionActionState {
  success: boolean
  error: string | null
}

const initialState: ExceptionActionState = {
  success: false,
  error: null,
}

export async function cancelSessionAction(
  _previousState: ExceptionActionState,
  formData: FormData,
): Promise<ExceptionActionState> {
  const sessionId = formData.get('session_id')
  const reason = formData.get('reason')
  const idempotencyKey = formData.get('idempotency_key')
  const correlationId = formData.get('correlation_id')

  if (typeof sessionId !== 'string') {
    return { ...initialState, error: 'Missing session id.' }
  }

  const parsed = cancelSessionRequestSchema.safeParse({
    reason,
    idempotency_key: idempotencyKey,
    correlation_id: typeof correlationId === 'string' ? correlationId : undefined,
  })

  if (!parsed.success) {
    return { ...initialState, error: 'Invalid cancellation request.' }
  }

  const result = await cancelParkingSession(sessionId, parsed.data)
  if (!result.success) {
    return {
      ...initialState,
      error: 'error' in result ? result.error ?? 'Unable to cancel session.' : 'Unable to cancel session.',
    }
  }

  revalidatePath('/sessions')
  revalidatePath(`/exit/${sessionId}`)
  return { success: true, error: null }
}

export async function lostTicketAction(
  _previousState: ExceptionActionState,
  formData: FormData,
): Promise<ExceptionActionState> {
  const sessionId = formData.get('session_id')
  const reason = formData.get('reason')
  const evidenceKey = formData.get('evidence_key')
  const evidenceValue = formData.get('evidence_value')
  const idempotencyKey = formData.get('idempotency_key')
  const correlationId = formData.get('correlation_id')

  if (typeof sessionId !== 'string') {
    return { ...initialState, error: 'Missing session id.' }
  }

  const evidence =
    typeof evidenceKey === 'string' &&
    evidenceKey.length > 0 &&
    typeof evidenceValue === 'string' &&
    evidenceValue.length > 0
      ? { [evidenceKey]: evidenceValue }
      : {}

  const parsed = lostTicketRequestSchema.safeParse({
    evidence,
    reason,
    idempotency_key: idempotencyKey,
    correlation_id: typeof correlationId === 'string' ? correlationId : undefined,
  })

  if (!parsed.success) {
    return { ...initialState, error: 'Invalid lost-ticket request.' }
  }

  const result = await processLostTicket(sessionId, parsed.data)
  if (!result.success) {
    return {
      ...initialState,
      error:
        'error' in result ? result.error ?? 'Unable to process lost ticket.' : 'Unable to process lost ticket.',
    }
  }

  revalidatePath('/sessions')
  revalidatePath(`/exit/${sessionId}`)
  return { success: true, error: null }
}

export async function correctSessionAction(
  _previousState: ExceptionActionState,
  formData: FormData,
): Promise<ExceptionActionState> {
  const sessionId = formData.get('session_id')
  const correctionType = formData.get('correction_type')
  const valuesRaw = formData.get('values')
  const reason = formData.get('reason')
  const idempotencyKey = formData.get('idempotency_key')
  const correlationId = formData.get('correlation_id')

  if (typeof sessionId !== 'string') {
    return { ...initialState, error: 'Missing session id.' }
  }

  let values: Record<string, unknown> = {}
  if (typeof valuesRaw === 'string' && valuesRaw.length > 0) {
    try {
      const parsedValues = JSON.parse(valuesRaw) as unknown
      if (parsedValues && typeof parsedValues === 'object' && !Array.isArray(parsedValues)) {
        values = parsedValues as Record<string, unknown>
      }
    } catch {
      return { ...initialState, error: 'Correction values must be valid JSON.' }
    }
  }

  const parsed = correctionRequestSchema.safeParse({
    correction_type: correctionType,
    values,
    reason,
    idempotency_key: idempotencyKey,
    correlation_id: typeof correlationId === 'string' ? correlationId : undefined,
  })

  if (!parsed.success) {
    return { ...initialState, error: 'Invalid correction request.' }
  }

  const result = await correctParkingSession(sessionId, parsed.data)
  if (!result.success) {
    return {
      ...initialState,
      error: 'error' in result ? result.error ?? 'Unable to correct session.' : 'Unable to correct session.',
    }
  }

  revalidatePath('/sessions')
  revalidatePath(`/exit/${sessionId}`)
  revalidatePath(`/payments/${sessionId}`)
  return { success: true, error: null }
}
