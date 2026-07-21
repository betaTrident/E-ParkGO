import { notFound } from 'next/navigation'

import { ExitConfirmation } from '@/features/exit/components/exit-confirmation'
import { getPaymentSessionFacts } from '@/features/payments/service'

interface ExitConfirmPageProps {
  params: Promise<{ sessionId: string }>
}

export default async function ExitConfirmPage({ params }: ExitConfirmPageProps) {
  const { sessionId } = await params
  const facts = await getPaymentSessionFacts(sessionId)

  if (!facts) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8 sm:px-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-blue-600 dark:text-blue-300">Confirmed exit</p>
        <h1 className="text-3xl font-bold tracking-tight">Release vehicle</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Separate from payment. Ticket {facts.ticketNumber} remains occupied until you confirm exit.
        </p>
      </header>
      <ExitConfirmation facts={facts} />
    </div>
  )
}
