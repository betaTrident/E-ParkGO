'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, ArrowLeft, CheckCircle2, QrCode } from 'lucide-react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SectionPanel } from '@/components/shared/section-panel'
import { manualTicketFormSchema } from '@/features/scanner/schemas'
import { extractTokenFromPayload } from '@/lib/security/qr-token'
import { cn } from '@/lib/utils'

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

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setCameraActive(false)
  }

  useEffect(() => {
    return () => {
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
      <SectionPanel
        title="Scan QR ticket"
        headerAction={
          <span className={cn('chip', cameraActive ? 'chip-active' : 'chip-neutral')}>
            {cameraActive ? 'Camera active' : 'Camera inactive'}
          </span>
        }
        bodyClassName="p-0 overflow-hidden"
      >
        <div className="relative aspect-[4/3] w-full bg-slate-950 sm:aspect-video">
          <video
            ref={videoRef}
            className={cn('size-full object-cover', !cameraActive && 'hidden')}
            muted
            playsInline
            aria-label="Live QR scanner preview"
          />

          {cameraActive && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="size-48 rounded-lg border-2 border-primary/80 bg-primary/5 animate-pulse" />
            </div>
          )}

          {!cameraActive && (
            <div className="flex size-full flex-col items-center justify-center gap-3 p-6 text-center text-white">
              <div className="flex size-12 items-center justify-center rounded-full bg-white/10">
                <QrCode className="size-6 text-white/80" />
              </div>
              <div className="max-w-xs space-y-1">
                <p className="text-sm font-semibold">Camera Scanner</p>
                <p className="text-xs text-slate-400">
                  {cameraDenied
                    ? 'Camera access was denied or unavailable. Use manual entry below.'
                    : 'Activate camera to scan physical QR ticket slips.'}
                </p>
              </div>
              <Button
                type="button"
                onClick={() => void startCamera()}
                disabled={pending}
                className="mt-2"
                size="sm"
              >
                Activate camera
              </Button>
            </div>
          )}
        </div>
      </SectionPanel>

      <SectionPanel
        title="Manual ticket entry"
        description="Enter the full ticket number printed on the entry slip."
      >
        <form className="space-y-4" onSubmit={(event) => void handleManualSubmit(event)}>
          <div className="space-y-2">
            <Label htmlFor="manual-ticket-number">Ticket number</Label>
            <Input
              id="manual-ticket-number"
              name="ticketNumber"
              autoComplete="off"
              value={manualTicket}
              onChange={(event) => setManualTicket(event.target.value)}
              placeholder="EPG-YYMMDD-XXXXXXXXC"
              className="font-mono uppercase tracking-wider"
              disabled={pending}
            />
            {manualError && (
              <p role="alert" className="text-xs text-destructive">
                {manualError}
              </p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            Look up ticket
          </Button>
        </form>
      </SectionPanel>

      {statusMessage && (
        <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200">
          <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
          <AlertDescription>{statusMessage}</AlertDescription>
        </Alert>
      )}

      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-start">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            stopCamera()
            router.push('/dashboard')
          }}
        >
          <ArrowLeft className="mr-1.5 size-4" />
          Back to dashboard
        </Button>
      </div>
    </div>
  )
}
