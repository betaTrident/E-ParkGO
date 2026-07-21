import { ShiftPanel } from '@/features/shifts/components/shift-panel'
import { getOpenShiftForActor } from '@/features/shifts/service'

export default async function ShiftsPage() {
  const openShift = await getOpenShiftForActor()

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8 sm:px-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-blue-600 dark:text-blue-300">Cash shift</p>
        <h1 className="text-3xl font-bold tracking-tight">Shift workflow</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Start and close your own shift. Discrepancies are recorded, never erased.
        </p>
      </header>
      <ShiftPanel openShift={openShift} />
    </div>
  )
}
