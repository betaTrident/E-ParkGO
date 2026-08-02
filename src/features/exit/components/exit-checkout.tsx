'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

import { FeeBreakdown } from '@/features/exit/components/fee-breakdown'
import type { ExitPreviewResult } from '@/features/exit/schemas'
import type { ExitSessionFacts } from '@/features/exit/service'
import { ReceiptPrint } from '@/features/payments/components/receipt-print'
import { Button } from '@/components/ui/button'
import { formatCentavosForDisplay } from '@/lib/money/centavos'

interface ExitCheckoutProps {
  facts: ExitSessionFacts
  preview: ExitPreviewResult
  quoteExpired?: boolean
}

interface SettleResultState {
  receiptNumber: string | null
  amountCentavos: string | null
  cashTenderedCentavos: string
  changeCentavos: string | null
  exitTime: string
}

export function ExitCheckout({ facts, preview, quoteExpired = false }: ExitCheckoutProps) {
  const [tender, setTender] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [result, setResult] = useState<SettleResultState | null>(null)
  const idempotencyKey = useMemo(() => crypto.randomUUID(), [])

  const dueCentavos = preview.total_centavos
  const requiresCash =
    preview.status === 'PAYMENT_PENDING' && dueCentavos !== '0'
  const paidAwaitingExit = preview.status === 'PAID_AWAITING_EXIT'

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setPending(true)

    const cashTendered = requiresCash ? tender : '0'

    try {
      const response = await fetch('/api/exit/settle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
          'X-Correlation-Id': crypto.randomUUID(),
        },
        body: JSON.stringify({
          session_id: facts.sessionId,
          cash_tendered_centavos: cashTendered,
        }),
      })

      const payload = await response.json()
      if (!response.ok || !payload.success) {
        setError(payload.error?.message ?? 'Unable to complete checkout.')
        return
      }

      setResult({
        receiptNumber: payload.data.receipt_number,
        amountCentavos: payload.data.amount_centavos,
        cashTenderedCentavos: payload.data.cash_tendered_centavos ?? cashTendered,
        changeCentavos: payload.data.change_centavos,
        exitTime: payload.data.exit_time,
      })
    } catch {
      setError('Network error. Your values are preserved; retry when connected.')
    } finally {
      setPending(false)
    }
  }

  if (result) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-900 dark:bg-emerald-950/40">
          <h2 className="text-xl font-semibold text-emerald-900 dark:text-emerald-100">
            Exit completed
          </h2>
          <p className="mt-2 text-sm text-emerald-800 dark:text-emerald-200">
            Cash collected and vehicle released in one step.
          </p>
        </div>

        {result.receiptNumber && result.amountCentavos ? (
          <ReceiptPrint
            receiptNumber={result.receiptNumber}
            ticketNumber={facts.ticketNumber}
            plateNumber={facts.displayPlateNumber}
            amountCentavos={result.amountCentavos}
            cashTenderedCentavos={result.cashTenderedCentavos}
            changeCentavos={result.changeCentavos ?? '0'}
          />
        ) : (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <dl className="grid gap-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Ticket</dt>
                <dd className="font-medium">{facts.ticketNumber}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Plate</dt>
                <dd className="font-medium">{facts.displayPlateNumber}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Amount due</dt>
                <dd className="font-medium">{formatCentavosForDisplay('0')}</dd>
              </div>
            </dl>
          </section>
        )}

        <Link
          href="/sessions"
          className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border px-4 text-sm font-medium"
        >
          Return to sessions
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <FeeBreakdown preview={preview} entryTime={facts.entryTime} quoteExpired={quoteExpired} />

      <form onSubmit={handleSubmit} className="space-y-4">
        {requiresCash ? (
          <>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm text-slate-500">Cash amount due (read-only)</p>
              <p className="text-3xl font-bold tracking-tight">
                {formatCentavosForDisplay(dueCentavos)}
              </p>
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-medium">Cash tendered (centavos)</span>
              <input
                inputMode="numeric"
                pattern="[0-9]*"
                value={tender}
                onChange={(event) => setTender(event.target.value.replace(/\D/g, ''))}
                className="h-12 w-full rounded-lg border border-slate-300 px-4 text-lg dark:border-slate-700 dark:bg-slate-950"
                required
              />
            </label>
          </>
        ) : !paidAwaitingExit ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              No cash is due. Confirm exit to release the vehicle.
            </p>
          </div>
        ) : null}

        <p className="text-sm text-slate-600 dark:text-slate-400">
          {paidAwaitingExit
            ? 'No cash is due. Confirm exit to release the vehicle.'
            : 'Cash only. Payment and exit are completed together on this screen.'}
        </p>

        <Button
          type="submit"
          disabled={pending || quoteExpired}
          className="min-h-11 w-full"
        >
          {pending
            ? 'Processing…'
            : paidAwaitingExit
              ? 'Confirm exit'
              : 'Collect cash & exit'}
        </Button>

        {error ? (
          <p role="alert" className="text-sm text-red-700 dark:text-red-300">
            {error}
          </p>
        ) : null}
      </form>
    </div>
  )
}
