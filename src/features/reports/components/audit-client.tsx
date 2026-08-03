'use client'

import { useState } from 'react'

import { AuditEventDetail } from '@/components/reports/audit-event-detail'
import type { AuditEventRow } from '@/features/reports/queries'
import { Button } from '@/components/ui/button'

interface AuditClientProps {
  initialFrom: string
  initialTo: string
}

export function AuditClient({ initialFrom, initialTo }: AuditClientProps) {
  const [from, setFrom] = useState(initialFrom)
  const [to, setTo] = useState(initialTo)
  const [action, setAction] = useState('')
  const [events, setEvents] = useState<AuditEventRow[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function search(cursor?: string) {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        from: new Date(`${from}T00:00:00+08:00`).toISOString(),
        to: new Date(`${to}T23:59:59+08:00`).toISOString(),
      })
      if (action.trim()) params.set('action', action.trim().toUpperCase())
      if (cursor) params.set('cursor', cursor)

      const response = await fetch(`/api/admin/audit?${params.toString()}`)
      const payload = await response.json()
      if (!response.ok || !payload.success) {
        setError(payload.error?.message ?? 'Unable to search audit logs.')
        return
      }

      const items = (payload.data?.items ?? []) as AuditEventRow[]
      setEvents((current) => (cursor ? [...current, ...items] : items))
      setNextCursor(payload.data?.pagination?.next_cursor ?? null)
    } catch {
      setError('Network error while searching audit logs.')
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
          void search()
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
          <span className="font-medium">Action</span>
          <input
            value={action}
            onChange={(event) => setAction(event.target.value.toUpperCase())}
            className="h-11 w-full rounded-lg border px-3 dark:border-slate-700 dark:bg-slate-950"
            placeholder="Optional"
          />
        </label>
        <div className="flex items-end">
          <Button type="submit" disabled={loading} className="min-h-11 w-full">
            {loading ? 'Searching…' : 'Search audit logs'}
          </Button>
        </div>
      </form>

      {error ? (
        <p role="alert" className="text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      ) : null}

      <div className="space-y-3">
        {events.length === 0 ? (
          <p className="text-sm text-slate-500">Run a search to load immutable audit evidence.</p>
        ) : (
          events.map((event) => <AuditEventDetail key={event.id} event={event} />)
        )}
      </div>

      {nextCursor ? (
        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={() => void search(nextCursor)}>
            Next page
          </Button>
        </div>
      ) : null}
    </div>
  )
}
