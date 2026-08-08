'use client'

import { useMemo } from 'react'
import { Calendar } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import {
  DataTable,
  type DataTableColumnDef,
} from '@/components/ui/data-table'
import { EmptyState } from '@/components/shared/empty-state'
import { PageHeader } from '@/components/shared/page-header'
import { SectionPanel } from '@/components/shared/section-panel'
import { StatusChip } from '@/components/shared/status-chip'
import { SessionRowActions } from '@/features/sessions/components/session-row-actions'

export interface SessionListItem {
  id: string
  status: string
  plateDisplay: string
  ticketNumber: string
}

interface SessionsPageViewProps {
  sessions: SessionListItem[]
}

export function SessionsPageView({ sessions }: SessionsPageViewProps) {
  const columns = useMemo<Array<DataTableColumnDef<SessionListItem>>>(
    () => [
      {
        id: 'plateDisplay',
        header: 'Vehicle Plate',
        cell: ({ row }) => (
          <span className="ref-tag">{row.original.plateDisplay}</span>
        ),
      },
      {
        accessorKey: 'ticketNumber',
        header: 'Ticket Number',
        cell: ({ row }) => (
          <span className="font-mono text-xs font-medium text-foreground">
            {row.original.ticketNumber}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusChip status={row.original.status} />,
      },
      {
        id: 'actions',
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <SessionRowActions
              sessionId={row.original.id}
              status={row.original.status}
            />
          </div>
        ),
      },
    ],
    [],
  )

  return (
    <div className="page-root">
      <PageHeader
        title="Active sessions"
        description="Sessions awaiting checkout, payment, or manual review. Standard exit flows use Checkout."
        badge={<Badge variant="outline">{sessions.length} active</Badge>}
      />

      {sessions.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No active sessions"
          description="No sessions currently need attention. New sessions will appear here as vehicles enter."
        />
      ) : (
        <SectionPanel title="Active Session Records" bodyClassName="p-0 overflow-hidden">
          <DataTable
            className="border-0 rounded-none"
            columns={columns}
            data={sessions}
            getRowId={(row) => row.id}
          />
        </SectionPanel>
      )}
    </div>
  )
}
