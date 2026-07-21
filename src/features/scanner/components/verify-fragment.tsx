'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import {
  parseQrFragment,
  readFragmentFromWindow,
  removeFragmentFromHistory,
} from '@/lib/security/qr-parser'

interface VerifyFragmentProps {
  onTokenReady: (token: string) => Promise<void>
}

type VerificationState =
  | { kind: 'pending' }
  | { kind: 'ready'; token: string }
  | { kind: 'error'; message: string }

export function VerifyFragment({ onTokenReady }: VerifyFragmentProps) {
  const router = useRouter()
  const submittedRef = useRef(false)
  const [initialState, setInitialState] = useState<VerificationState>({
    kind: 'pending',
  })
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useLayoutEffect(() => {
    const fragment = readFragmentFromWindow()
    removeFragmentFromHistory('/verify')

    const parsed = parseQrFragment(fragment)
    if (!parsed) {
      setInitialState({
        kind: 'error',
        message: 'The scanned link is invalid or incomplete.',
      })
      setError('The scanned link is invalid or incomplete.')
      return
    }

    setInitialState({ kind: 'ready', token: parsed.token })
  }, [])

  useEffect(() => {
    if (initialState.kind !== 'ready' || submittedRef.current) {
      return
    }

    submittedRef.current = true
    setPending(true)

    void onTokenReady(initialState.token)
      .catch(() => {
        setError('Unable to validate this ticket right now.')
        submittedRef.current = false
      })
      .finally(() => {
        setPending(false)
      })
  }, [initialState, onTokenReady])

  return (
    <div className="mx-auto max-w-lg space-y-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <h1 className="text-2xl font-semibold tracking-tight">Verifying ticket</h1>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        The QR fragment was removed from the browser address bar immediately. Validation
        continues using a secure request body only.
      </p>
      {pending ? (
        <p role="status" aria-live="polite">
          Checking ticket…
        </p>
      ) : null}
      {error ? (
        <div className="space-y-4">
          <p role="alert" className="text-sm text-red-700 dark:text-red-300">
            {error}
          </p>
          <Button type="button" onClick={() => router.push('/scanner')}>
            Open scanner
          </Button>
        </div>
      ) : null}
    </div>
  )
}
