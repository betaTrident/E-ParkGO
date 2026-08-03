'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  dashboardSnapshotQueryOptions,
  invalidateDashboardSnapshot,
} from '@/features/dashboard/queries'
import type { DashboardSnapshot, RealtimeConnectionState } from '@/features/dashboard/types'
import {
  DASHBOARD_POLL_INTERVAL_MS,
  DASHBOARD_STALE_AFTER_MS,
  createDashboardChannelManager,
} from '@/lib/realtime/dashboard-channel'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { recordDashboardCanonicalRefetch } from '@/lib/realtime/dashboard-telemetry'

interface UseDashboardRealtimeOptions {
  locationId: string
  businessDate?: string
  initialSnapshot?: DashboardSnapshot
  enabled?: boolean
}

export function useDashboardRealtime({
  locationId,
  businessDate,
  initialSnapshot,
  enabled = true,
}: UseDashboardRealtimeOptions) {
  const queryClient = useQueryClient()
  const supabase = useMemo(() => createBrowserSupabaseClient(), [])
  const [connectionState, setConnectionState] =
    useState<RealtimeConnectionState>('idle')
  const [lastLiveAt, setLastLiveAt] = useState<number | null>(null)
  const knownVersionRef = useRef(initialSnapshot?.aggregate_version ?? 0)

  const query = useQuery({
    ...dashboardSnapshotQueryOptions(locationId, businessDate, initialSnapshot),
    enabled,
  })

  useEffect(() => {
    if (query.data?.aggregate_version !== undefined) {
      knownVersionRef.current = query.data.aggregate_version
    }
  }, [query.data?.aggregate_version])

  const refetchCanonical = useCallback(async () => {
    const startedAt = performance.now()
    setConnectionState((current) =>
      current === 'offline' ? current : 'reconnecting',
    )
    await invalidateDashboardSnapshot(queryClient, locationId, businessDate)
    const result = await query.refetch()
    if (result.data) {
      knownVersionRef.current = result.data.aggregate_version
      setLastLiveAt(Date.now())
      setConnectionState('live')
      recordDashboardCanonicalRefetch(Math.round(performance.now() - startedAt))
    }
  }, [businessDate, locationId, query, queryClient])

  useEffect(() => {
    if (!enabled) {
      return
    }

    const manager = createDashboardChannelManager(supabase, locationId, {
      onInvalidate: (payload) => {
        if (payload.aggregate_version < knownVersionRef.current) {
          return
        }

        if (payload.aggregate_version > knownVersionRef.current) {
          void refetchCanonical()
          return
        }

        void invalidateDashboardSnapshot(queryClient, locationId, businessDate)
      },
      onStatusChange: (status) => {
        if (status === 'live') {
          setLastLiveAt(Date.now())
          setConnectionState('live')
          return
        }

        if (status === 'connecting') {
          setConnectionState('connecting')
          return
        }

        if (status === 'reconnecting') {
          setConnectionState('reconnecting')
        }
      },
    })

    manager.subscribe()

    return () => {
      manager.unsubscribe()
      setConnectionState('idle')
    }
  }, [businessDate, enabled, locationId, queryClient, refetchCanonical, supabase])

  useEffect(() => {
    if (!enabled) {
      return
    }

    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'visible') {
        return
      }

      const staleSince =
        lastLiveAt ?? (query.dataUpdatedAt > 0 ? query.dataUpdatedAt : null)

      if (
        staleSince !== null &&
        Date.now() - staleSince >= DASHBOARD_STALE_AFTER_MS
      ) {
        setConnectionState('stale')
        void query.refetch()
      }
    }, DASHBOARD_POLL_INTERVAL_MS)

    return () => window.clearInterval(timer)
  }, [enabled, lastLiveAt, query, query.dataUpdatedAt])

  return {
    snapshot: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    connectionState,
    lastUpdatedAt: query.data?.snapshot_at ?? initialSnapshot?.snapshot_at,
    refresh: refetchCanonical,
  }
}
