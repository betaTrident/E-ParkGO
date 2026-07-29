'use client'

import { useState } from 'react'

import type { AuditEventRow } from '@/features/reports/queries'
import { Button } from '@/components/ui/button'

interface AuditEventDetailProps {
  event: AuditEventRow
}

function formatJson(value: Record<string, unknown> | null): string {
  if (!value || Object.keys(value).length === 0) {
    return 'No disclosed fields.'
  }

  return JSON.stringify(value, null, 2)
}

export function AuditEventDetail({ event }: AuditEventDetailProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium">{event.action}</p>
          <p className="text-sm text-slate-500">
            {new Date(event.created_at).toLocaleString()} · {event.result}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? 'Hide details' : 'View details'}
        </Button>
      </div>

      {open ? (
        <div className="mt-4 space-y-3 text-sm">
          <p>
            <span className="font-medium">Target:</span> {event.target_type}
            {event.target_id ? ` · ${event.target_id}` : ''}
          </p>
          {event.reason ? (
            <p>
              <span className="font-medium">Reason:</span> {event.reason}
            </p>
          ) : null}
          <p>
            <span className="font-medium">Correlation:</span> {event.correlation_id}
          </p>
          <div>
            <p className="font-medium">Before (redacted)</p>
            <pre className="mt-1 overflow-x-auto rounded-lg bg-slate-50 p-3 text-xs dark:bg-slate-950">
              {formatJson(event.before_data)}
            </pre>
          </div>
          <div>
            <p className="font-medium">After (redacted)</p>
            <pre className="mt-1 overflow-x-auto rounded-lg bg-slate-50 p-3 text-xs dark:bg-slate-950">
              {formatJson(event.after_data)}
            </pre>
          </div>
        </div>
      ) : null}
    </div>
  )
}
