'use client'

import Link from 'next/link'
import { useState } from 'react'

import { Button, buttonVariants } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ExceptionActions,
  getExceptionCapabilities,
  type ExceptionDialogKind,
} from '@/features/sessions/components/exception-actions'
import { cn } from '@/lib/utils'

interface SessionRowActionsProps {
  sessionId: string
  status: string
}

export function SessionRowActions({ sessionId, status }: SessionRowActionsProps) {
  const [dialog, setDialog] = useState<ExceptionDialogKind | null>(null)
  const { canCancel, canLostTicket, canCorrect } = getExceptionCapabilities(status)
  const hasMoreActions = canCancel || canLostTicket || canCorrect

  function openDialog(kind: ExceptionDialogKind) {
    setDialog(kind)
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={`/exit/${sessionId}`}
          className={cn(buttonVariants({ size: 'sm' }))}
        >
          Checkout
        </Link>

        {hasMoreActions ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="More actions"
              render={<Button variant="outline" size="sm" />}
            >
              More actions
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canLostTicket ? (
                <DropdownMenuItem onClick={() => openDialog('lost-ticket')}>
                  Process lost ticket
                </DropdownMenuItem>
              ) : null}
              {canCancel ? (
                <DropdownMenuItem onClick={() => openDialog('cancel')}>
                  Cancel session
                </DropdownMenuItem>
              ) : null}
              {canCorrect ? (
                <DropdownMenuItem onClick={() => openDialog('correct')}>
                  Correct session
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>

      <ExceptionActions sessionId={sessionId} dialog={dialog} onDialogChange={setDialog} />
    </div>
  )
}
