import {
  SessionsPageView,
  type SessionListItem,
} from '@/features/sessions/components/sessions-page-view'
import { listExceptionSessions } from '@/features/sessions/service'

function toSessionListItem(
  session: Awaited<ReturnType<typeof listExceptionSessions>>[number],
): SessionListItem {
  const vehicle = Array.isArray(session.vehicles) ? session.vehicles[0] : session.vehicles
  const ticket = Array.isArray(session.parking_tickets)
    ? session.parking_tickets[0]
    : session.parking_tickets

  return {
    id: session.id,
    status: session.status,
    plateDisplay: vehicle?.display_plate_number ?? 'Unknown plate',
    ticketNumber: ticket?.ticket_number ?? 'No ticket',
  }
}

export default async function SessionsPage() {
  const sessions = await listExceptionSessions()

  return <SessionsPageView sessions={sessions.map(toSessionListItem)} />
}
