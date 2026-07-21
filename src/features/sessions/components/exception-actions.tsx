'use client'

import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'

interface ExceptionActionsProps {
  sessionId: string
  status: string
}

type DialogKind = 'cancel' | 'lost-ticket' | 'correct' | null

export function ExceptionActions({ sessionId, status }: ExceptionActionsProps) {
  const [dialog, setDialog] = useState<DialogKind>(null)
  const [reason, setReason] = useState('')
  const [evidenceKey, setEvidenceKey] = useState('plate_photo')
  const [evidenceValue, setEvidenceValue] = useState('')
  const [correctionType, setCorrectionType] = useState('DISCOUNT_PERCENT')
  const [valuesJson, setValuesJson] = useState('{"percent":"10"}')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const idempotencyKey = useMemo(() => crypto.randomUUID(), [])

  const canCancel = status === 'PAYMENT_PENDING'
  const canLostTicket = ['PAYMENT_PENDING', 'PAID_AWAITING_EXIT'].includes(status)
  const canCorrect = ['PAYMENT_PENDING', 'LOST_TICKET', 'MANUAL_REVIEW'].includes(status)

  function closeDialog() {
    setDialog(null)
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
      setDialog(null)
    } catch {
      setError('Network error while submitting exception.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {canCancel ? (
          <Button type="button" variant="outline" size="sm" onClick={() => setDialog('cancel')}>
            Cancel session
          </Button>
        ) : null}
        {canLostTicket ? (
          <Button type="button" variant="outline" size="sm" onClick={() => setDialog('lost-ticket')}>
            Lost ticket
          </Button>
        ) : null}
        {canCorrect ? (
          <Button type="button" variant="outline" size="sm" onClick={() => setDialog('correct')}>
            Correct session
          </Button>
        ) : null}
      </div>

      {dialog ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
          <p className="text-sm font-medium">
            {dialog === 'cancel'
              ? 'Cancel unpaid session'
              : dialog === 'lost-ticket'
                ? 'Process lost ticket'
                : 'Apply correction'}
          </p>
          <label className="mt-3 block space-y-1">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Reason</span>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="min-h-20 w-full rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              minLength={10}
              required
            />
          </label>

          {dialog === 'lost-ticket' ? (
            <>
              <label className="mt-3 block space-y-1">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Evidence key
                </span>
                <input
                  value={evidenceKey}
                  onChange={(event) => setEvidenceKey(event.target.value)}
                  className="h-10 w-full rounded-lg border px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                />
              </label>
              <label className="mt-3 block space-y-1">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Evidence value
                </span>
                <input
                  value={evidenceValue}
                  onChange={(event) => setEvidenceValue(event.target.value)}
                  className="h-10 w-full rounded-lg border px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                  required
                />
              </label>
            </>
          ) : null}

          {dialog === 'correct' ? (
            <>
              <label className="mt-3 block space-y-1">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Correction type
                </span>
                <select
                  value={correctionType}
                  onChange={(event) => setCorrectionType(event.target.value)}
                  className="h-10 w-full rounded-lg border px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                >
                  <option value="DISCOUNT_PERCENT">Discount percent</option>
                  <option value="COMPLIMENTARY">Complimentary</option>
                  <option value="ADJUSTMENT_CENTAVOS">Adjustment centavos</option>
                  <option value="ENTRY_TIME">Entry time</option>
                </select>
              </label>
              <label className="mt-3 block space-y-1">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Values (JSON)
                </span>
                <textarea
                  value={valuesJson}
                  onChange={(event) => setValuesJson(event.target.value)}
                  className="min-h-16 w-full rounded-lg border px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-900"
                />
              </label>
            </>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
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
              Confirm
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={closeDialog} disabled={pending}>
              Close
            </Button>
          </div>
        </div>
      ) : null}

      {message ? <p className="text-xs text-emerald-700 dark:text-emerald-300">{message}</p> : null}
      {error ? (
        <p role="alert" className="text-xs text-red-700 dark:text-red-300">
          {error}
        </p>
      ) : null}
    </div>
  )
}
