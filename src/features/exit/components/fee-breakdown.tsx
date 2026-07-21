'use client'

import type { ExitPreviewResult } from '@/features/exit/schemas'
import { formatCentavosForDisplay } from '@/lib/money/centavos'
import { formatBusinessDateTime, formatQuoteExpiry } from '@/lib/time/business-time'

interface FeeBreakdownProps {
  preview: ExitPreviewResult
  entryTime: string
  quoteExpired?: boolean
}

function LineItem({
  label,
  value,
  emphasize = false,
}: {
  label: string
  value: string
  emphasize?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <dt
        className={
          emphasize
            ? 'font-semibold text-slate-900 dark:text-slate-100'
            : 'text-slate-600 dark:text-slate-300'
        }
      >
        {label}
      </dt>
      <dd
        className={
          emphasize
            ? 'text-lg font-bold text-slate-900 dark:text-slate-50'
            : 'font-medium text-slate-900 dark:text-slate-100'
        }
      >
        {value}
      </dd>
    </div>
  )
}

export function FeeBreakdown({
  preview,
  entryTime,
  quoteExpired = false,
}: FeeBreakdownProps) {
  const statusLabel =
    preview.status === 'PAID_AWAITING_EXIT'
      ? 'No payment required'
      : 'Payment pending'

  return (
    <section
      aria-labelledby="fee-breakdown-heading"
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <header className="space-y-1">
        <h2 id="fee-breakdown-heading" className="text-xl font-semibold tracking-tight">
          Fee preview
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Authoritative quote from the facility rate snapshot. Totals cannot be edited.
        </p>
      </header>

      <dl className="mt-6 space-y-3">
        <LineItem label="Billed minutes" value={String(preview.billed_minutes)} />
        <LineItem
          label="Subtotal"
          value={formatCentavosForDisplay(preview.subtotal_centavos)}
        />
        {preview.discount_centavos !== '0' ? (
          <LineItem
            label="Discount"
            value={formatCentavosForDisplay(preview.discount_centavos)}
          />
        ) : null}
        {preview.penalty_centavos !== '0' ? (
          <LineItem
            label="Penalty"
            value={formatCentavosForDisplay(preview.penalty_centavos)}
          />
        ) : null}
        {preview.adjustment_centavos !== '0' ? (
          <LineItem
            label="Adjustment"
            value={formatCentavosForDisplay(preview.adjustment_centavos)}
          />
        ) : null}
        <div className="border-t border-slate-200 pt-3 dark:border-slate-700">
          <LineItem
            label="Total due"
            value={formatCentavosForDisplay(preview.total_centavos)}
            emphasize
          />
        </div>
      </dl>

      <div className="mt-6 space-y-2 rounded-xl bg-slate-50 p-4 text-sm dark:bg-slate-950/60">
        <p>
          <span className="font-medium">Status:</span>{' '}
          <span aria-live="polite">{statusLabel}</span>
        </p>
        <p>
          <span className="font-medium">Quote expires:</span>{' '}
          <time dateTime={preview.quote_expires_at}>
            {formatQuoteExpiry(preview.quote_expires_at)}
          </time>
        </p>
        <p className="text-slate-600 dark:text-slate-400">
          Entry recorded at {formatBusinessDateTime(entryTime)}
        </p>
      </div>

      {quoteExpired ? (
        <p
          role="status"
          className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100"
        >
          This quote has expired. Request a fresh preview before continuing.
        </p>
      ) : null}
    </section>
  )
}
