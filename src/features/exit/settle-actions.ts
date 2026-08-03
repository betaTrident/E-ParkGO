'use server'

import { revalidatePath } from 'next/cache'

import { settleCashAndExitRequestSchema } from '@/features/exit/schemas'
import { settleCashAndExit } from '@/features/exit/service'

export interface SettleActionState {
  success: boolean
  error: string | null
  data: Awaited<ReturnType<typeof settleCashAndExit>>['data'] | null
}

const initialState: SettleActionState = {
  success: false,
  error: null,
  data: null,
}

export async function settleCashAndExitAction(
  _previousState: SettleActionState,
  formData: FormData,
): Promise<SettleActionState> {
  const sessionId = formData.get('sessionId')
  const cashTenderedCentavos = formData.get('cashTenderedCentavos')
  const idempotencyKey = formData.get('idempotencyKey')
  const correlationId = formData.get('correlationId')

  if (
    typeof sessionId !== 'string' ||
    typeof cashTenderedCentavos !== 'string' ||
    typeof idempotencyKey !== 'string'
  ) {
    return {
      ...initialState,
      error: 'Missing required checkout fields.',
    }
  }

  const parsed = settleCashAndExitRequestSchema.safeParse({
    session_id: sessionId,
    cash_tendered_centavos: cashTenderedCentavos,
    idempotency_key: idempotencyKey,
    correlation_id: typeof correlationId === 'string' ? correlationId : crypto.randomUUID(),
  })

  if (!parsed.success) {
    return {
      ...initialState,
      error: parsed.error.issues[0]?.message ?? 'Invalid checkout request.',
    }
  }

  const result = await settleCashAndExit(parsed.data)

  if (!result.success || !result.data) {
    return {
      ...initialState,
      error: result.error ?? 'Unable to settle and complete exit.',
    }
  }

  revalidatePath(`/exit/${sessionId}`)
  revalidatePath('/sessions')
  revalidatePath('/dashboard')

  return {
    success: true,
    error: null,
    data: result.data,
  }
}
