import { notFound } from 'next/navigation'

import { ExitPageClient } from '@/features/exit/components/exit-page-client'
import { getExitSessionFacts } from '@/features/exit/service'

interface ExitPageProps {
  params: Promise<{ sessionId: string }>
}

export default async function ExitPage({ params }: ExitPageProps) {
  const { sessionId } = await params
  const facts = await getExitSessionFacts(sessionId)

  if (!facts) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-blue-600 dark:text-blue-300">Operations</p>
        <h1 className="text-3xl font-bold tracking-tight">Exit preview</h1>
        <p className="max-w-2xl text-slate-600 dark:text-slate-400">
          Review the parked session and request an authoritative fee quote, then continue to payment or exit
          confirmation.
        </p>
      </header>
      <ExitPageClient facts={facts} quoteExpired={facts.quoteExpired} />
    </div>
  )
}
