'use client'

import { useMemo, useState } from 'react'

import { ReportTable } from '@/components/reports/report-table'
import type { TransactionRow } from '@/features/reports/queries'
import { formatCentavosForDisplay } from '@/lib/money/centavos'
import { Button } from '@/components/ui/button'

interface TransactionsClientProps {
  initialFrom: string
  initialTo: string
}

export function TransactionsClient({ initialFrom, initialTo }: TransactionsClientProps) {
  const [from, setFrom] = useState(initialFrom)
  const [to, setTo] = useState(initialTo)
  const [plate, setPlate] = useState('')
  const [rows, setRows] = useState<TransactionRow[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const columns = useMemo(
    () => [
      { key: 'processed_at', header: 'Processed', render: (row: TransactionRow) => new Date(row.processed_at).toLocaleString() },
      { key: 'receipt_number', header: 'Receipt' },
      { key: 'plate_display', header: 'Plate' },
      { key: 'payment_kind', header: 'Kind' },
      {
        key: 'amount_centavos',
        header: 'Amount',
        render: (row: TransactionRow) => formatCentavosForDisplay(row.amount_centavos),
      },
      { key: 'session_status', header: 'Session status' },
    ],
    [],
  )

  async function loadTransactions(cursor?: string) {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ from, to })
      if (plate.trim()) params.set('plate', plate.trim())
      if (cursor) params.set('cursor', cursor)

      const response = await fetch(`/api/transactions?${params.toString()}`)
      const payload = await response.json()
      if (!response.ok || !payload.success) {
        setError(payload.error?.message ?? 'Unable to load transactions.')
        return
      }

      const items = (payload.data?.items ?? []) as TransactionRow[]
      setRows((current) => (cursor ? [...current, ...items] : items))
      setNextCursor(payload.data?.pagination?.next_cursor ?? null)
    } catch {
      setError('Network error while loading transactions.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <form
        className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-2 lg:grid-cols-4"
        onSubmit={(event) => {
          event.preventDefault()
          void loadTransactions()
        }}
      >
        <label className="space-y-1 text-sm">
          <span className="font-medium">From</span>
          <input
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
            className="h-11 w-full rounded-lg border px-3 dark:border-slate-700 dark:bg-slate-950"
            required
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium">To</span>
          <input
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
            className="h-11 w-full rounded-lg border px-3 dark:border-slate-700 dark:bg-slate-950"
            required
          />
        </label>
        <label className="space-y-1 text-sm sm:col-span-2 lg:col-span-1">
          <span className="font-medium">Plate</span>
          <input
            value={plate}
            onChange={(event) => setPlate(event.target.value.toUpperCase())}
            className="h-11 w-full rounded-lg border px-3 dark:border-slate-700 dark:bg-slate-950"
            placeholder="Optional"
          />
        </label>
        <div className="flex items-end">
          <Button type="submit" disabled={loading} className="min-h-11 w-full">
            {loading ? 'Searching…' : 'Search transactions'}
          </Button>
        </div>
      </form>

      {error ? (
        <p role="alert" className="text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      ) : null}

      <ReportTable
        caption="Transaction history"
        columns={columns}
        rows={rows.map((row) => ({ ...row, id: row.payment_id }))}
        emptyMessage="Run a search to load transaction history."
        nextCursor={nextCursor}
        onNextPage={(cursor) => void loadTransactions(cursor)}
        isLoading={loading}
      />
    </div>
  )
}
