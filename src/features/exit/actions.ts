'use server'

import { revalidatePath } from 'next/cache'

import type { ExitPreviewResult } from '@/features/exit/schemas'
import { calculateExitPreview } from '@/features/exit/service'

export interface ExitPreviewActionState {
  success: boolean
  error: string | null
  data: ExitPreviewResult | null
}

const initialState: ExitPreviewActionState = {
  success: false,
  error: null,
  data: null,
}

export async function exitPreviewAction(
  _previousState: ExitPreviewActionState,
  formData: FormData,
): Promise<ExitPreviewActionState> {
  const sessionId = formData.get('sessionId')
  const idempotencyKey = formData.get('idempotencyKey')
  const correlationId = formData.get('correlationId')

  if (typeof sessionId !== 'string' || typeof idempotencyKey !== 'string') {
    return {
      ...initialState,
      error: 'Missing session or idempotency key.',
    }
  }

  const result = await calculateExitPreview({
    session_id: sessionId,
    idempotency_key: idempotencyKey,
    correlation_id:
      typeof correlationId === 'string' ? correlationId : crypto.randomUUID(),
  })

  if (!result.success || !result.data) {
    return {
      ...initialState,
      error: result.error ?? 'Unable to calculate the exit preview.',
    }
  }

  revalidatePath(`/exit/${sessionId}`)

  return {
    success: true,
    error: null,
    data: result.data,
  }
}
