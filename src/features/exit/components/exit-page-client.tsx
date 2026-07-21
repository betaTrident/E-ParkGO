'use client'

import Link from 'next/link'
import { useActionState, useMemo } from 'react'

import { FeeBreakdown } from '@/features/exit/components/fee-breakdown'
import { exitPreviewAction, type ExitPreviewActionState } from '@/features/exit/actions'
import type { ExitSessionFacts } from '@/features/exit/service'
import { Button } from '@/components/ui/button'
import { formatBusinessDateTime } from '@/lib/time/business-time'

const initialState: ExitPreviewActionState = {
  success: false,
  error: null,
  data: null,
}

interface ExitPageClientProps {
  facts: ExitSessionFacts
  quoteExpired: boolean
}

export function ExitPageClient({ facts, quoteExpired }: ExitPageClientProps) {
  const [state, formAction, pending] = useActionState(exitPreviewAction, initialState)
  const idempotencyKey = useMemo(() => crypto.randomUUID(), [])
  const correlationId = useMemo(() => crypto.randomUUID(), [])

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-xl font-semibold tracking-tight">Session review</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">Ticket</dt>
            <dd className="font-medium">{facts.ticketNumber}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Plate</dt>
            <dd className="font-medium">{facts.displayPlateNumber}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Vehicle</dt>
            <dd className="font-medium">{facts.vehicleType}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Space</dt>
            <dd className="font-medium">{facts.spaceCode}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Entry time</dt>
            <dd className="font-medium">{formatBusinessDateTime(facts.entryTime)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Status</dt>
            <dd className="font-medium">{facts.status.replaceAll('_', ' ')}</dd>
          </div>
        </dl>
      </section>

      {state.data ? (
        <div className="space-y-4">
          <FeeBreakdown
            preview={state.data}
            entryTime={facts.entryTime}
            quoteExpired={quoteExpired}
          />
          {state.data.status === 'PAYMENT_PENDING' ? (
            <Link
              href={`/payments/${facts.sessionId}`}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
            >
              Record cash payment
            </Link>
          ) : (
            <Link
              href={`/exit/${facts.sessionId}/confirm`}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
            >
              Continue to exit confirmation
            </Link>
          )}
        </div>
      ) : (
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="sessionId" value={facts.sessionId} />
          <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
          <input type="hidden" name="correlationId" value={correlationId} />
          <Button type="submit" disabled={pending || facts.status === 'ACTIVE'}>
            {pending ? 'Calculating…' : 'Calculate exit preview'}
          </Button>
          {facts.status === 'ACTIVE' ? (
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Validate the ticket first to begin exit review.
            </p>
          ) : null}
        </form>
      )}

      {state.error ? (
        <p role="alert" className="text-sm text-red-700 dark:text-red-300">
          {state.error}
        </p>
      ) : null}
    </div>
  )
}
