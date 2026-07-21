'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react'
import { usePathname } from 'next/navigation'

interface TicketCredentialContextValue {
  readTicketCredential: (ticketNumber: string) => string | null
  storeTicketCredential: (ticketNumber: string, qrPayload: string) => void
  clearTicketCredential: (ticketNumber: string) => void
  clearAllTicketCredentials: () => void
}

const ticketCredentials = new Map<string, string>()

const TicketCredentialContext = createContext<TicketCredentialContextValue | null>(
  null,
)

export function TicketCredentialProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname.startsWith('/tickets/')) {
      ticketCredentials.clear()
    }
  }, [pathname])

  const readTicketCredential = useCallback((ticketNumber: string) => {
    return ticketCredentials.get(ticketNumber) ?? null
  }, [])

  const storeTicketCredential = useCallback((ticketNumber: string, qrPayload: string) => {
    ticketCredentials.set(ticketNumber, qrPayload)
  }, [])

  const clearTicketCredential = useCallback((ticketNumber: string) => {
    ticketCredentials.delete(ticketNumber)
  }, [])

  const clearAllTicketCredentials = useCallback(() => {
    ticketCredentials.clear()
  }, [])

  const value = useMemo(
    () => ({
      readTicketCredential,
      storeTicketCredential,
      clearTicketCredential,
      clearAllTicketCredentials,
    }),
    [
      clearAllTicketCredentials,
      clearTicketCredential,
      readTicketCredential,
      storeTicketCredential,
    ],
  )

  return (
    <TicketCredentialContext.Provider value={value}>
      {children}
    </TicketCredentialContext.Provider>
  )
}

export function useTicketCredentials(): TicketCredentialContextValue {
  const context = useContext(TicketCredentialContext)

  if (!context) {
    throw new Error('useTicketCredentials must be used within TicketCredentialProvider')
  }

  return context
}
