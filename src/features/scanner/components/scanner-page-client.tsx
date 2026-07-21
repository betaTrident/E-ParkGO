'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'

import { ScannerView } from '@/features/scanner/components/scanner-view'

async function submitValidation(body: Record<string, string>) {
  const response = await fetch('/api/tickets/validate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': crypto.randomUUID(),
      'X-Correlation-Id': crypto.randomUUID(),
    },
    body: JSON.stringify(body),
  })

  const payload = (await response.json()) as {
    success: boolean
    data?: { session_id: string; status: string }
    error?: { message: string; code?: string }
  }

  if (!response.ok || !payload.success || !payload.data) {
    throw new Error(payload.error?.message ?? 'Unable to validate the ticket.')
  }

  return payload.data
}

export function ScannerPageClient() {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSuccess = useCallback(
    async (lookup: Record<string, string>) => {
      setPending(true)
      setErrorMessage(null)
      setStatusMessage(null)

      try {
        const result = await submitValidation(lookup)
        setStatusMessage(`Ticket validated. Session is ${result.status.replaceAll('_', ' ').toLowerCase()}.`)
        router.push(`/exit/${result.session_id}`)
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : 'Unable to validate the ticket.',
        )
      } finally {
        setPending(false)
      }
    },
    [router],
  )

  return (
    <ScannerView
      pending={pending}
      statusMessage={statusMessage}
      errorMessage={errorMessage}
      onManualSubmit={async (ticketNumber) => {
        await handleSuccess({ ticket_number: ticketNumber })
      }}
      onTokenDetected={async (token) => {
        await handleSuccess({ token })
      }}
    />
  )
}
