'use client'

import { useActionState, useMemo } from 'react'

import { ExitCheckout } from '@/features/exit/components/exit-checkout'
import { exitPreviewAction, type ExitPreviewActionState } from '@/features/exit/actions'
import type { ExitPreviewResult } from '@/features/exit/schemas'
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

function buildPaidAwaitingPreview(facts: ExitSessionFacts): ExitPreviewResult {
  const paidAmount = facts.totalCentavos ?? '0'

  return {
    session_id: facts.sessionId,
    status: 'PAID_AWAITING_EXIT',
    billed_minutes: 0,
    subtotal_centavos: paidAmount,
    discount_centavos: '0',
    penalty_centavos: '0',
    adjustment_centavos: '0',
    total_centavos: '0',
    fee_version: 1,
    quote_expires_at: facts.quoteExpiresAt ?? new Date().toISOString(),
  }
}

export function ExitPageClient({ facts, quoteExpired }: ExitPageClientProps) {
  const [state, formAction, pending] = useActionState(exitPreviewAction, initialState)
  const idempotencyKey = useMemo(() => crypto.randomUUID(), [])
  const correlationId = useMemo(() => crypto.randomUUID(), [])

  const paidAwaitingPreview = useMemo(
    () => (facts.status === 'PAID_AWAITING_EXIT' ? buildPaidAwaitingPreview(facts) : null),
    [facts],
  )
  const preview = state.data ?? paidAwaitingPreview
  const showCalculateForm = !preview

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

      {preview ? (
        <ExitCheckout facts={facts} preview={preview} quoteExpired={quoteExpired} />
      ) : null}

      {showCalculateForm ? (
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
      ) : null}

      {state.error ? (
        <p role="alert" className="text-sm text-red-700 dark:text-red-300">
          {state.error}
        </p>
      ) : null}
    </div>
  )
}
