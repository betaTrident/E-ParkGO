'use client'

import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { formatCentavosForDisplay } from '@/lib/money/centavos'

interface ShiftPanelProps {
  openShift: {
    id: string
    opened_at: string
    opening_float_centavos: number
  } | null
}

export function ShiftPanel({ openShift }: ShiftPanelProps) {
  const [floatAmount, setFloatAmount] = useState('0')
  const [declaredCash, setDeclaredCash] = useState('0')
  const [notes, setNotes] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const startKey = useMemo(() => crypto.randomUUID(), [])
  const closeKey = useMemo(() => crypto.randomUUID(), [])

  async function startShift() {
    setPending(true)
    setError(null)
    setMessage(null)
    try {
      const response = await fetch('/api/shifts/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': startKey,
          'X-Correlation-Id': crypto.randomUUID(),
        },
        body: JSON.stringify({ opening_float_centavos: floatAmount }),
      })
      const payload = await response.json()
      if (!response.ok || !payload.success) {
        setError(payload.error?.message ?? 'Unable to start shift.')
        return
      }
      setMessage('Shift opened. Refresh to see live totals.')
    } catch {
      setError('Network error while starting shift.')
    } finally {
      setPending(false)
    }
  }

  async function closeShift() {
    if (!openShift) {
      return
    }
    setPending(true)
    setError(null)
    setMessage(null)
    try {
      const response = await fetch('/api/shifts/close', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': closeKey,
          'X-Correlation-Id': crypto.randomUUID(),
        },
        body: JSON.stringify({
          shift_id: openShift.id,
          declared_cash_centavos: declaredCash,
          notes,
        }),
      })
      const payload = await response.json()
      if (!response.ok || !payload.success) {
        setError(payload.error?.message ?? 'Unable to close shift.')
        return
      }
      setMessage('Shift closed. Variance was recorded immutably.')
    } catch {
      setError('Network error while closing shift.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="space-y-6">
      {openShift ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold">Open shift</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Opened {new Date(openShift.opened_at).toLocaleString()} with float{' '}
            {formatCentavosForDisplay(BigInt(openShift.opening_float_centavos))}.
          </p>
          <label className="mt-4 block space-y-2">
            <span className="text-sm font-medium">Declared cash (centavos)</span>
            <input
              inputMode="numeric"
              value={declaredCash}
              onChange={(event) => setDeclaredCash(event.target.value.replace(/\D/g, ''))}
              className="h-11 w-full rounded-lg border px-3 dark:border-slate-700 dark:bg-slate-950"
            />
          </label>
          <label className="mt-4 block space-y-2">
            <span className="text-sm font-medium">Notes</span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="min-h-24 w-full rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
            />
          </label>
          <Button type="button" onClick={closeShift} disabled={pending} className="mt-4 min-h-11">
            Close shift
          </Button>
        </section>
      ) : (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold">Start shift</h2>
          <label className="mt-4 block space-y-2">
            <span className="text-sm font-medium">Opening float (centavos)</span>
            <input
              inputMode="numeric"
              value={floatAmount}
              onChange={(event) => setFloatAmount(event.target.value.replace(/\D/g, ''))}
              className="h-11 w-full rounded-lg border px-3 dark:border-slate-700 dark:bg-slate-950"
            />
          </label>
          <Button type="button" onClick={startShift} disabled={pending} className="mt-4 min-h-11">
            Start shift
          </Button>
        </section>
      )}

      {message ? <p className="text-sm text-emerald-700 dark:text-emerald-300">{message}</p> : null}
      {error ? (
        <p role="alert" className="text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      ) : null}
    </div>
  )
}
