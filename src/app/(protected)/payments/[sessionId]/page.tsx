import { notFound } from 'next/navigation'

import { PaymentForm } from '@/features/payments/components/payment-form'
import { getPaymentSessionFacts } from '@/features/payments/service'
import { getOpenShiftForActor } from '@/features/shifts/service'

interface PaymentPageProps {
  params: Promise<{ sessionId: string }>
}

export default async function PaymentPage({ params }: PaymentPageProps) {
  const { sessionId } = await params
  const [facts, openShift] = await Promise.all([
    getPaymentSessionFacts(sessionId),
    getOpenShiftForActor(),
  ])

  if (!facts) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8 sm:px-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-blue-600 dark:text-blue-300">Cash payment</p>
        <h1 className="text-3xl font-bold tracking-tight">Record payment</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Ticket {facts.ticketNumber} · {facts.displayPlateNumber}
        </p>
      </header>

      {!openShift ? (
        <p role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          Open a cash shift on the Shifts page before recording payments.
        </p>
      ) : null}

      <PaymentForm facts={facts} />
    </div>
  )
}
