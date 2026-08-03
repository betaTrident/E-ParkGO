'use client'

import { useEffect, useRef, useState } from 'react'
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

export function VerifyFragment({ onTokenReady }: VerifyFragmentProps) {
  const router = useRouter()
  const submittedRef = useRef(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const fragment = readFragmentFromWindow()
    removeFragmentFromHistory('/verify')

    const parsed = parseQrFragment(fragment)
    if (!parsed) {
      setError('The scanned link is invalid or incomplete.')
      return
    }

    setToken(parsed.token)
  }, [])

  useEffect(() => {
    if (!token || submittedRef.current) {
      return
    }

    submittedRef.current = true
    setPending(true)

    void onTokenReady(token)
      .catch(() => {
        setError('Unable to validate this ticket right now.')
        submittedRef.current = false
      })
      .finally(() => {
        setPending(false)
      })
  }, [onTokenReady, token])

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
