import { TransactionsClient } from '@/features/reports/components/transactions-client'
import { getDefaultReportRange } from '@/lib/time/business-date'

export default function TransactionsPage() {
  const { from, to } = getDefaultReportRange()

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-blue-600 dark:text-blue-300">Finance</p>
        <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Search location-scoped payment history with bounded business-date filters.
        </p>
      </header>
      <TransactionsClient initialFrom={from} initialTo={to} />
    </div>
  )
}
