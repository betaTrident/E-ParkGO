'use server'

import { revalidatePath } from 'next/cache'

import {
  exitConfirmationRequestSchema,
  paymentRequestSchema,
} from '@/features/payments/schemas'
import {
  confirmVehicleExit,
  recordParkingPayment,
} from '@/features/payments/service'

export interface PaymentActionState {
  success: boolean
  error: string | null
}

const initialState: PaymentActionState = {
  success: false,
  error: null,
}

export async function recordPaymentAction(
  _previousState: PaymentActionState,
  formData: FormData,
): Promise<PaymentActionState> {
  const sessionId = formData.get('session_id')
  const tender = formData.get('cash_tendered_centavos')
  const externalReference = formData.get('external_reference')
  const idempotencyKey = formData.get('idempotency_key')
  const correlationId = formData.get('correlation_id')

  const parsed = paymentRequestSchema.safeParse({
    session_id: sessionId,
    cash_tendered_centavos: tender,
    external_reference:
      typeof externalReference === 'string' && externalReference.length > 0
        ? externalReference
        : undefined,
    idempotency_key: idempotencyKey,
    correlation_id: typeof correlationId === 'string' ? correlationId : undefined,
  })

  if (!parsed.success) {
    return { ...initialState, error: 'Invalid payment request.' }
  }

  const result = await recordParkingPayment(parsed.data)
  if (!result.success) {
    return {
      ...initialState,
      error: 'error' in result ? result.error ?? 'Unable to record payment.' : 'Unable to record payment.',
    }
  }

  revalidatePath(`/payments/${parsed.data.session_id}`)
  revalidatePath(`/exit/${parsed.data.session_id}`)
  revalidatePath('/sessions')
  return { success: true, error: null }
}

export async function confirmExitAction(
  _previousState: PaymentActionState,
  formData: FormData,
): Promise<PaymentActionState> {
  const sessionId = formData.get('session_id')
  const idempotencyKey = formData.get('idempotency_key')
  const correlationId = formData.get('correlation_id')

  const parsed = exitConfirmationRequestSchema.safeParse({
    session_id: sessionId,
    idempotency_key: idempotencyKey,
    correlation_id: typeof correlationId === 'string' ? correlationId : undefined,
  })

  if (!parsed.success) {
    return { ...initialState, error: 'Invalid exit confirmation request.' }
  }

  const result = await confirmVehicleExit(parsed.data)
  if (!result.success) {
    return {
      ...initialState,
      error: 'error' in result ? result.error ?? 'Unable to confirm exit.' : 'Unable to confirm exit.',
    }
  }

  revalidatePath(`/exit/${parsed.data.session_id}/confirm`)
  revalidatePath('/sessions')
  return { success: true, error: null }
}
