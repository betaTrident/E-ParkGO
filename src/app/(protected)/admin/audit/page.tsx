import { AuditClient } from '@/features/reports/components/audit-client'
import { requireAdminProfile } from '@/lib/auth/session'
import { getDefaultReportRange } from '@/lib/time/business-date'

export default async function AuditPage() {
  await requireAdminProfile()
  const { from, to } = getDefaultReportRange()

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-blue-600 dark:text-blue-300">Administration</p>
        <h1 className="text-3xl font-bold tracking-tight">Audit log</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Search immutable operational evidence with redacted disclosure only.
        </p>
      </header>
      <AuditClient initialFrom={from} initialTo={to} />
    </div>
  )
}
