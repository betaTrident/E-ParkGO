import { SessionRowActions } from '@/features/sessions/components/session-row-actions'
import { cn } from '@/lib/utils'

export interface SessionListItem {
  id: string
  status: string
  plateDisplay: string
  ticketNumber: string
}

interface SessionsPageViewProps {
  sessions: SessionListItem[]
}

function formatSessionStatus(status: string): string {
  return status
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function statusPillClass(status: string): string {
  if (status === 'PAID_AWAITING_EXIT') {
    return 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'
  }

  if (
    status === 'PAYMENT_PENDING' ||
    status === 'LOST_TICKET' ||
    status === 'MANUAL_REVIEW'
  ) {
    return 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
  }

  return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
}

const sessionCardClass =
  'rounded-md border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900'

export function SessionsPageView({ sessions }: SessionsPageViewProps) {
  return (
    <div className="space-y-5 p-4 sm:p-6 xl:p-7">
      <header className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          Active sessions
        </h1>
        <p className="max-w-2xl text-sm text-slate-500 dark:text-slate-400">
          Sessions awaiting checkout, payment, or manual review. Use Checkout for
          the standard exit flow; open More actions for exceptions only.
        </p>
      </header>

      {sessions.length === 0 ? (
        <section
          aria-label="Active sessions"
          className={sessionCardClass}
        >
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No sessions need attention.
          </p>
        </section>
      ) : (
        <ul className="space-y-4" aria-label="Active sessions">
          {sessions.map((session) => (
            <li key={session.id} className={sessionCardClass}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="inline-block rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-[11px] font-semibold tracking-wider text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {session.plateDisplay}
                  </span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {session.ticketNumber}
                  </span>
                  <span
                    className={cn(
                      'inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                      statusPillClass(session.status),
                    )}
                  >
                    {formatSessionStatus(session.status)}
                  </span>
                </div>

                <SessionRowActions sessionId={session.id} status={session.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
