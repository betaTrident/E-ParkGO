'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import type { PaymentSessionFacts } from '@/features/payments/service'

interface ExitConfirmationProps {
  facts: PaymentSessionFacts
}

export function ExitConfirmation({ facts }: ExitConfirmationProps) {
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [completed, setCompleted] = useState(false)
  const idempotencyKey = useMemo(() => crypto.randomUUID(), [])

  async function handleConfirm() {
    setError(null)
    setPending(true)

    try {
      const response = await fetch('/api/exit/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
          'X-Correlation-Id': crypto.randomUUID(),
        },
        body: JSON.stringify({ session_id: facts.sessionId }),
      })

      const payload = await response.json()
      if (!response.ok || !payload.success) {
        setError(payload.error?.message ?? 'Unable to confirm exit.')
        return
      }

      setCompleted(true)
    } catch {
      setError('Network error. Retry with the same action; duplicate exit is blocked server-side.')
    } finally {
      setPending(false)
    }
  }

  if (completed) {
    return (
      <div className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-900 dark:bg-emerald-950/40">
        <h2 className="text-xl font-semibold text-emerald-900 dark:text-emerald-100">Exit completed</h2>
        <p className="text-sm text-emerald-800 dark:text-emerald-200">
          The session is completed and the parking space has been released exactly once.
        </p>
        <Link
          href="/sessions"
          className="inline-flex min-h-11 items-center justify-center rounded-lg border px-4 text-sm font-medium"
        >
          Return to sessions
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900 dark:bg-amber-950/30">
      <h2 className="text-xl font-semibold">Confirm vehicle exit</h2>
      <p className="text-sm text-slate-700 dark:text-slate-300">
        This action records the official exit time and releases space for ticket {facts.ticketNumber}. Payment alone
        does not release the space.
      </p>
      <Button
        type="button"
        onClick={handleConfirm}
        disabled={pending || facts.status !== 'PAID_AWAITING_EXIT'}
        className="min-h-11 w-full"
      >
        {pending ? 'Confirming exit…' : 'Confirm exit and release space'}
      </Button>
      {facts.status !== 'PAID_AWAITING_EXIT' ? (
        <p className="text-sm text-amber-800 dark:text-amber-200">
          Session status is {facts.status.replaceAll('_', ' ').toLowerCase()}. Complete payment first.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      ) : null}
    </div>
  )
}
