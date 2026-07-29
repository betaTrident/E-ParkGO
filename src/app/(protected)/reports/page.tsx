import { ReportsClient } from '@/features/reports/components/reports-client'
import { requireActiveProfile } from '@/lib/auth/session'
import { getDefaultReportRange } from '@/lib/time/business-date'

export default async function ReportsPage() {
  const profile = await requireActiveProfile()
  const { from, to } = getDefaultReportRange()

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-blue-600 dark:text-blue-300">Finance</p>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Preview reconciled revenue, movement, occupancy, and shift totals using Asia/Manila business dates.
        </p>
      </header>
      <ReportsClient initialFrom={from} initialTo={to} canExport={profile.role === 'ADMIN'} />
    </div>
  )
}
