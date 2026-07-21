'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { manualTicketFormSchema } from '@/features/scanner/schemas'
import { extractTokenFromPayload } from '@/lib/security/qr-token'

type BarcodeDetectorLike = {
  detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>
}

declare global {
  interface Window {
    BarcodeDetector?: new (options: { formats: string[] }) => BarcodeDetectorLike
  }
}

interface ScannerViewProps {
  onManualSubmit: (ticketNumber: string) => Promise<void>
  onTokenDetected: (token: string) => Promise<void>
  pending?: boolean
  statusMessage?: string | null
  errorMessage?: string | null
}

export function ScannerView({
  onManualSubmit,
  onTokenDetected,
  pending = false,
  statusMessage = null,
  errorMessage = null,
}: ScannerViewProps) {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraDenied, setCameraDenied] = useState(false)
  const [manualTicket, setManualTicket] = useState('')
  const [manualError, setManualError] = useState<string | null>(null)
  const [showManualPrompt, setShowManualPrompt] = useState(false)

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setCameraActive(false)
  }

  useEffect(() => {
    const timer = window.setTimeout(() => setShowManualPrompt(true), 10_000)
    return () => {
      window.clearTimeout(timer)
      stopCamera()
    }
  }, [])

  const startCamera = async () => {
    setCameraDenied(false)
    setManualError(null)

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraDenied(true)
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
        },
        audio: false,
      })

      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      setCameraActive(true)

      if ('BarcodeDetector' in window) {
        const detector = new window.BarcodeDetector({ formats: ['qr_code'] })
        const scan = async () => {
          if (!videoRef.current || !streamRef.current) {
            return
          }

          try {
            const codes = await detector.detect(videoRef.current)
            const raw = codes[0]?.rawValue
            const token = extractTokenFromPayload(raw)

            if (token) {
              stopCamera()
              await onTokenDetected(token)
              return
            }
          } catch {
            // Continue scanning until a valid token is detected.
          }

          window.requestAnimationFrame(scan)
        }

        window.requestAnimationFrame(scan)
      }
    } catch {
      setCameraDenied(true)
      stopCamera()
    }
  }

  const handleManualSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const parsed = manualTicketFormSchema.safeParse({ ticketNumber: manualTicket })

    if (!parsed.success) {
      setManualError(parsed.error.issues[0]?.message ?? 'Enter a valid ticket number.')
      return
    }

    setManualError(null)
    await onManualSubmit(parsed.data.ticketNumber)
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-black/90 dark:border-slate-800">
        <video
          ref={videoRef}
          className="aspect-[3/4] w-full object-cover"
          muted
          playsInline
          aria-label="Live QR scanner preview"
        />
        {!cameraActive ? (
          <div className="flex flex-col items-center gap-4 bg-slate-950 px-6 py-10 text-center text-white">
            <p className="text-sm text-slate-200">
              Camera access starts only after you choose Scan ticket. Manual entry is always
              available.
            </p>
            <Button type="button" onClick={() => void startCamera()} disabled={pending}>
              Scan ticket
            </Button>
          </div>
        ) : null}
      </div>

      {cameraDenied || showManualPrompt ? (
        <form className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900" onSubmit={(event) => void handleManualSubmit(event)}>
          <div className="space-y-2">
            <Label htmlFor="manual-ticket-number">Ticket number</Label>
            <Input
              id="manual-ticket-number"
              name="ticketNumber"
              autoComplete="off"
              value={manualTicket}
              onChange={(event) => setManualTicket(event.target.value)}
              placeholder="EPG-YYMMDD-XXXXXXXXC"
              disabled={pending}
            />
            {manualError ? (
              <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                {manualError}
              </p>
            ) : null}
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            Look up ticket
          </Button>
        </form>
      ) : null}

      {statusMessage ? (
        <p role="status" className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
          {statusMessage}
        </p>
      ) : null}

      {errorMessage ? (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-100">
          {errorMessage}
        </p>
      ) : null}

      <Button
        type="button"
        variant="outline"
        onClick={() => {
          stopCamera()
          router.push('/dashboard')
        }}
      >
        Back to dashboard
      </Button>
    </div>
  )
}
