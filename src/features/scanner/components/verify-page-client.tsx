'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'

import { VerifyFragment } from '@/features/scanner/components/verify-fragment'

export function VerifyPageClient() {
  const router = useRouter()

  const handleTokenReady = useCallback(
    async (token: string) => {
      const response = await fetch('/api/tickets/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': crypto.randomUUID(),
          'X-Correlation-Id': crypto.randomUUID(),
        },
        body: JSON.stringify({ token }),
      })

      const payload = (await response.json()) as {
        success: boolean
        data?: { session_id: string }
        error?: { message: string }
      }

      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error?.message ?? 'Unable to validate the ticket.')
      }

      router.replace(`/exit/${payload.data.session_id}`)
    },
    [router],
  )

  return <VerifyFragment onTokenReady={handleTokenReady} />
}
