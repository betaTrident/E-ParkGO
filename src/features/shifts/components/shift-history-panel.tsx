import { ReportTable } from '@/components/reports/report-table'
import type { ShiftHistoryRow } from '@/features/reports/queries'
import { listShiftHistory } from '@/features/reports/service'
import { formatCentavosForDisplay } from '@/lib/money/centavos'

const columns = [
  { key: 'opened_at', header: 'Opened', render: (row: ShiftHistoryRow) => new Date(row.opened_at).toLocaleString() },
  { key: 'status', header: 'Status' },
  {
    key: 'expected_cash_centavos',
    header: 'Expected',
    render: (row: ShiftHistoryRow) => formatCentavosForDisplay(row.expected_cash_centavos),
  },
  {
    key: 'declared_cash_centavos',
    header: 'Declared',
    render: (row: ShiftHistoryRow) => formatCentavosForDisplay(row.declared_cash_centavos),
  },
  {
    key: 'variance_centavos',
    header: 'Variance',
    render: (row: ShiftHistoryRow) => formatCentavosForDisplay(row.variance_centavos),
  },
]

export async function ShiftHistoryPanel() {
  const history = await listShiftHistory()

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold">Shift history</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Review closed shifts, expected cash, declared totals, and recorded variance.
        </p>
      </header>
      <ReportTable
        caption="Shift history"
        columns={columns}
        rows={(history?.items ?? []).map((row) => ({ ...row, id: row.shift_id }))}
        emptyMessage="No shift history yet."
      />
    </section>
  )
}
