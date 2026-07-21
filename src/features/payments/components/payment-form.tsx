'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { formatCentavosForDisplay } from '@/lib/money/centavos'
import type { PaymentSessionFacts } from '@/features/payments/service'
import { ReceiptPrint } from '@/features/payments/components/receipt-print'

interface PaymentFormProps {
  facts: PaymentSessionFacts
}

interface PaymentResultState {
  paymentId: string
  receiptNumber: string
  amountCentavos: string
  cashTenderedCentavos: string
  changeCentavos: string
}

export function PaymentForm({ facts }: PaymentFormProps) {
  const [tender, setTender] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [result, setResult] = useState<PaymentResultState | null>(null)
  const idempotencyKey = useMemo(() => crypto.randomUUID(), [])

  const dueCentavos = facts.totalCentavos ?? '0'

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setPending(true)

    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
          'X-Correlation-Id': crypto.randomUUID(),
        },
        body: JSON.stringify({
          session_id: facts.sessionId,
          cash_tendered_centavos: tender,
        }),
      })

      const payload = await response.json()
      if (!response.ok || !payload.success) {
        setError(payload.error?.message ?? 'Unable to record payment.')
        return
      }

      setResult({
        paymentId: payload.data.payment_id,
        receiptNumber: payload.data.receipt_number,
        amountCentavos: payload.data.amount_centavos,
        cashTenderedCentavos: payload.data.cash_tendered_centavos,
        changeCentavos: payload.data.change_centavos,
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
        <ReceiptPrint
          receiptNumber={result.receiptNumber}
          ticketNumber={facts.ticketNumber}
          plateNumber={facts.displayPlateNumber}
          amountCentavos={result.amountCentavos}
          cashTenderedCentavos={result.cashTenderedCentavos}
          changeCentavos={result.changeCentavos}
        />
        <Link
          href={`/exit/${facts.sessionId}/confirm`}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          Continue to exit confirmation
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm text-slate-500">Amount due (read-only)</p>
        <p className="text-3xl font-bold tracking-tight">{formatCentavosForDisplay(dueCentavos)}</p>
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

      <Button type="submit" disabled={pending || Number(dueCentavos) === 0} className="min-h-11 w-full">
        {pending ? 'Recording payment…' : 'Confirm cash payment'}
      </Button>

      {Number(dueCentavos) === 0 ? (
        <p className="text-sm text-amber-700 dark:text-amber-300">
          No cash is due. Continue directly to exit confirmation.
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      ) : null}
    </form>
  )
}
