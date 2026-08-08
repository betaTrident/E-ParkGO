'use client'

import { useMemo, useState } from 'react'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import type { ExceptionDialogKind } from '@/features/sessions/components/exception-actions'

interface SessionExceptionSheetProps {
  sessionId: string
  dialog: ExceptionDialogKind | null
  onDialogChange: (dialog: ExceptionDialogKind | null) => void
}

export function SessionExceptionSheet({
  sessionId,
  dialog,
  onDialogChange,
}: SessionExceptionSheetProps) {
  const [reason, setReason] = useState('')
  const [evidenceKey, setEvidenceKey] = useState('plate_photo')
  const [evidenceValue, setEvidenceValue] = useState('')
  const [correctionType, setCorrectionType] = useState('DISCOUNT_PERCENT')
  const [valuesJson, setValuesJson] = useState('{"percent":"10"}')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const idempotencyKey = useMemo(() => crypto.randomUUID(), [])

  function closeDialog() {
    onDialogChange(null)
    setReason('')
    setEvidenceValue('')
    setError(null)
    setMessage(null)
  }

  async function submitException(path: string, body: Record<string, unknown>) {
    setPending(true)
    setError(null)
    setMessage(null)
    try {
      const response = await fetch(path, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
          'X-Correlation-Id': crypto.randomUUID(),
        },
        body: JSON.stringify(body),
      })
      const payload = await response.json()
      if (!response.ok || !payload.success) {
        setError(payload.error?.message ?? 'Unable to complete exception action.')
        return
      }
      setMessage('Exception recorded. Refresh to see updated session state.')
      setTimeout(() => {
        closeDialog()
      }, 1500)
    } catch {
      setError('Network error while submitting exception.')
    } finally {
      setPending(false)
    }
  }

  const title =
    dialog === 'cancel'
      ? 'Cancel unpaid session'
      : dialog === 'lost-ticket'
        ? 'Process lost ticket'
        : dialog === 'correct'
          ? 'Apply session correction'
          : ''

  const description =
    dialog === 'cancel'
      ? 'Record reason to cancel an unpaid session.'
      : dialog === 'lost-ticket'
        ? 'Issue lost ticket exception with required evidence.'
        : dialog === 'correct'
          ? 'Apply discount, complimentary adjustment, or correct entry time.'
          : ''

  return (
    <Sheet open={dialog !== null} onOpenChange={(open) => !open && closeDialog()}>
      <SheetContent className="w-full sm:max-w-md p-6">
        <SheetHeader className="px-0">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="exception-reason">Reason (min. 10 characters)</Label>
            <Textarea
              id="exception-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Detailed justification for this audit action..."
              className="min-h-20 text-xs"
              minLength={10}
              required
            />
          </div>

          {dialog === 'lost-ticket' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="evidence-key">Evidence key</Label>
                <Input
                  id="evidence-key"
                  value={evidenceKey}
                  onChange={(event) => setEvidenceKey(event.target.value)}
                  className="font-mono text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="evidence-value">Evidence value</Label>
                <Input
                  id="evidence-value"
                  value={evidenceValue}
                  onChange={(event) => setEvidenceValue(event.target.value)}
                  placeholder="Photo ID / Reference URL / Slip ID"
                  className="text-xs"
                  required
                />
              </div>
            </>
          )}

          {dialog === 'correct' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="correction-type">Correction type</Label>
                <Select value={correctionType} onValueChange={(val) => val && setCorrectionType(val)}>
                  <SelectTrigger id="correction-type" className="w-full text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DISCOUNT_PERCENT">Discount percent</SelectItem>
                    <SelectItem value="COMPLIMENTARY">Complimentary</SelectItem>
                    <SelectItem value="ADJUSTMENT_CENTAVOS">Adjustment centavos</SelectItem>
                    <SelectItem value="ENTRY_TIME">Entry time</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="values-json">Correction values (JSON)</Label>
                <Textarea
                  id="values-json"
                  value={valuesJson}
                  onChange={(event) => setValuesJson(event.target.value)}
                  className="min-h-20 font-mono text-xs"
                />
              </div>
            </>
          )}

          {message && (
            <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200">
              <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <SheetFooter className="flex-row gap-2 px-0 sm:justify-end">
          <Button variant="outline" size="sm" onClick={closeDialog} disabled={pending}>
            Cancel
          </Button>

          <Button
            size="sm"
            disabled={pending || reason.trim().length < 10}
            onClick={() => {
              if (dialog === 'cancel') {
                void submitException(`/api/sessions/${sessionId}/cancel`, { reason })
                return
              }
              if (dialog === 'lost-ticket') {
                void submitException(`/api/sessions/${sessionId}/lost-ticket`, {
                  reason,
                  evidence: { [evidenceKey]: evidenceValue },
                })
                return
              }
              let values: Record<string, unknown> = {}
              try {
                values = JSON.parse(valuesJson) as Record<string, unknown>
              } catch {
                setError('Correction values must be valid JSON.')
                return
              }
              void submitException(`/api/sessions/${sessionId}/correct`, {
                reason,
                correction_type: correctionType,
                values,
              })
            }}
          >
            {pending ? 'Submitting...' : 'Confirm'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
