import Link from 'next/link'

import { ExceptionActions } from '@/features/sessions/components/exception-actions'
import { listExceptionSessions } from '@/features/sessions/service'

export default async function SessionsPage() {
  const sessions = await listExceptionSessions()

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-blue-600 dark:text-blue-300">Operations</p>
        <h1 className="text-3xl font-bold tracking-tight">Active & exception sessions</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Search payment-pending, paid-awaiting-exit, lost-ticket, and manual-review sessions.
        </p>
      </header>

      <ul className="divide-y rounded-2xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
        {sessions.length === 0 ? (
          <li className="p-6 text-sm text-slate-500">No exception sessions right now.</li>
        ) : (
          sessions.map((session) => {
            const vehicle = Array.isArray(session.vehicles) ? session.vehicles[0] : session.vehicles
            const ticket = Array.isArray(session.parking_tickets)
              ? session.parking_tickets[0]
              : session.parking_tickets

            return (
              <li key={session.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{vehicle?.display_plate_number ?? 'Unknown plate'}</p>
                  <p className="text-sm text-slate-500">
                    {ticket?.ticket_number ?? 'No ticket'} · {session.status.replaceAll('_', ' ')}
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:items-end">
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/exit/${session.id}`} className="rounded-lg border px-3 py-2 text-sm">
                      Exit preview
                    </Link>
                    <Link href={`/payments/${session.id}`} className="rounded-lg border px-3 py-2 text-sm">
                      Payment
                    </Link>
                    <Link href={`/exit/${session.id}/confirm`} className="rounded-lg border px-3 py-2 text-sm">
                      Confirm exit
                    </Link>
                  </div>
                  <ExceptionActions sessionId={session.id} status={session.status} />
                </div>
              </li>
            )
          })
        )}
      </ul>
    </div>
  )
}
