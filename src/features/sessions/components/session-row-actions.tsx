'use client'

import Link from 'next/link'
import { useState } from 'react'
import { MoreHorizontal } from 'lucide-react'

import { Button, buttonVariants } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  getExceptionCapabilities,
  type ExceptionDialogKind,
} from '@/features/sessions/components/exception-actions'
import { SessionExceptionSheet } from '@/features/sessions/components/session-exception-sheet'
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
    <>
      <div className="flex items-center gap-2">
        <Link
          href={`/exit/${sessionId}`}
          className={cn(buttonVariants({ size: 'sm' }))}
        >
          Checkout
        </Link>

        {hasMoreActions && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm" aria-label="More actions">
                  <MoreHorizontal className="size-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              {canLostTicket && (
                <DropdownMenuItem onClick={() => openDialog('lost-ticket')}>
                  Process lost ticket
                </DropdownMenuItem>
              )}
              {canCancel && (
                <DropdownMenuItem onClick={() => openDialog('cancel')}>
                  Cancel session
                </DropdownMenuItem>
              )}
              {canCorrect && (
                <DropdownMenuItem onClick={() => openDialog('correct')}>
                  Correct session
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <SessionExceptionSheet
        sessionId={sessionId}
        dialog={dialog}
        onDialogChange={setDialog}
      />
    </>
  )
}
