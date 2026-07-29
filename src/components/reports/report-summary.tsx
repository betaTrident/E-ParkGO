import { formatCentavosForDisplay } from '@/lib/money/centavos'

interface ReportSummaryProps {
  title: string
  timezone: string
  from: string
  to: string
  summary: Record<string, string | number>
}

function formatSummaryValue(key: string, value: string | number): string {
  if (key.endsWith('_centavos') && typeof value === 'string') {
    try {
      return formatCentavosForDisplay(value)
    } catch {
      return value
    }
  }

  if (key.endsWith('_bps') && typeof value === 'number') {
    return `${(value / 100).toFixed(2)}%`
  }

  return String(value)
}

function labelize(key: string): string {
  return key
    .replace(/_centavos$/, '')
    .replace(/_bps$/, ' %')
    .replaceAll('_', ' ')
}

export function ReportSummary({ title, timezone, from, to, summary }: ReportSummaryProps) {
  const entries = Object.entries(summary)

  return (
    <section
      aria-label={title}
      className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
    >
      <header className="space-y-1">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {from} to {to} · Business timezone {timezone}
        </p>
      </header>

      {entries.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">No summary data for this range.</p>
      ) : (
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          {entries.map(([key, value]) => (
            <div key={key} className="rounded-lg border border-slate-100 px-3 py-2 dark:border-slate-800">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{labelize(key)}</dt>
              <dd className="mt-1 font-mono text-base font-semibold">{formatSummaryValue(key, value)}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  )
}
