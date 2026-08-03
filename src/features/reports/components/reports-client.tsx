'use client'

import { useMemo, useState } from 'react'

import { ReportSummary } from '@/components/reports/report-summary'
import type { ReportPreviewResult } from '@/features/reports/queries'
import { Button } from '@/components/ui/button'

const REPORT_TYPES = [
  { value: 'DAILY_REVENUE', label: 'Daily revenue' },
  { value: 'MOVEMENTS', label: 'Movements' },
  { value: 'OCCUPANCY', label: 'Occupancy' },
  { value: 'SHIFT_RECONCILIATION', label: 'Shift reconciliation' },
] as const

interface ReportsClientProps {
  initialFrom: string
  initialTo: string
  canExport: boolean
}

export function ReportsClient({ initialFrom, initialTo, canExport }: ReportsClientProps) {
  const [type, setType] = useState<(typeof REPORT_TYPES)[number]['value']>('DAILY_REVENUE')
  const [from, setFrom] = useState(initialFrom)
  const [to, setTo] = useState(initialTo)
  const [preview, setPreview] = useState<ReportPreviewResult | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const exportKey = useMemo(() => crypto.randomUUID(), [])

  async function runPreview() {
    setLoading(true)
    setError(null)
    setMessage(null)
    try {
      const response = await fetch('/api/reports/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Correlation-Id': crypto.randomUUID(),
        },
        body: JSON.stringify({ type, from, to }),
      })
      const payload = await response.json()
      if (!response.ok || !payload.success) {
        setError(payload.error?.message ?? 'Unable to load report preview.')
        return
      }
      setPreview(payload.data as ReportPreviewResult)
    } catch {
      setError('Network error while loading report preview.')
    } finally {
      setLoading(false)
    }
  }

  async function runExport() {
    if (!canExport) {
      setError('You do not have permission to export reports.')
      return
    }

    setLoading(true)
    setError(null)
    setMessage(null)
    try {
      const response = await fetch('/api/reports/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': exportKey,
          'X-Correlation-Id': crypto.randomUUID(),
        },
        body: JSON.stringify({ type, from, to }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        setError(payload?.error?.message ?? 'Export failed.')
        return
      }

      const blob = await response.blob()
      const filename =
        response.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] ??
        `report-${type.toLowerCase()}.csv`
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = filename
      anchor.click()
      URL.revokeObjectURL(url)
      setMessage('Export completed and audit evidence recorded.')
    } catch {
      setError('Network error while exporting report.')
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
          void runPreview()
        }}
      >
        <label className="space-y-1 text-sm sm:col-span-2 lg:col-span-1">
          <span className="font-medium">Report type</span>
          <select
            value={type}
            onChange={(event) => setType(event.target.value as typeof type)}
            className="h-11 w-full rounded-lg border px-3 dark:border-slate-700 dark:bg-slate-950"
          >
            {REPORT_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
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
        <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-1 lg:justify-end">
          <Button type="submit" disabled={loading} className="min-h-11">
            {loading ? 'Loading…' : 'Preview report'}
          </Button>
          {canExport ? (
            <Button type="button" variant="outline" disabled={loading} onClick={() => void runExport()}>
              Export CSV
            </Button>
          ) : null}
        </div>
      </form>

      {error ? (
        <p role="alert" className="text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      ) : null}
      {message ? <p className="text-sm text-emerald-700 dark:text-emerald-300">{message}</p> : null}

      {preview ? (
        <ReportSummary
          title={`${preview.report_type.replaceAll('_', ' ')} summary`}
          timezone={preview.timezone}
          from={preview.from}
          to={preview.to}
          summary={preview.summary}
        />
      ) : null}
    </div>
  )
}
