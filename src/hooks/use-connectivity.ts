'use client'

import { useCallback, useEffect, useState } from 'react'

export type ConnectivityStatus = 'online' | 'offline' | 'degraded'

const HEALTH_PATH = '/api/dashboard'

export function useConnectivity(pollMs = 60_000) {
  // Keep the first render identical on server and client; probe updates after mount.
  const [status, setStatus] = useState<ConnectivityStatus>('online')

  const probe = useCallback(async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setStatus('offline')
      return
    }

    try {
      const response = await fetch(HEALTH_PATH, {
        method: 'HEAD',
        credentials: 'same-origin',
        cache: 'no-store',
      })

      if (response.ok || response.status === 401) {
        setStatus('online')
        return
      }

      setStatus('degraded')
    } catch {
      setStatus(typeof navigator !== 'undefined' && navigator.onLine ? 'degraded' : 'offline')
    }
  }, [])

  useEffect(() => {
    if (!navigator.onLine) {
      setStatus('offline')
    }

    const onOnline = () => {
      void probe()
    }
    const onOffline = () => setStatus('offline')

    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)

    const initialProbe = window.setTimeout(() => {
      void probe()
    }, 0)
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void probe()
      }
    }, pollMs)

    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      window.clearTimeout(initialProbe)
      window.clearInterval(timer)
    }
  }, [pollMs, probe])

  return { status, probe }
}
