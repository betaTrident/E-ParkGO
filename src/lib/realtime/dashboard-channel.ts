import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js'

import {
  DASHBOARD_BROADCAST_EVENT,
  buildDashboardTopic,
  parseDashboardInvalidatePayload,
} from '@/lib/realtime/types'
import type { DashboardInvalidatePayload } from '@/features/dashboard/types'
import {
  recordDashboardInvalidation,
  recordDashboardReconnectAttempt,
  recordDashboardSubscriptionCount,
} from '@/lib/realtime/dashboard-telemetry'

export const DASHBOARD_STALE_AFTER_MS = 30_000
export const DASHBOARD_POLL_INTERVAL_MS = 30_000
const MAX_BACKOFF_MS = 30_000

export interface DashboardChannelHandlers {
  onInvalidate: (payload: DashboardInvalidatePayload) => void
  onStatusChange: (status: 'connecting' | 'live' | 'reconnecting' | 'error') => void
}

export interface DashboardChannelManager {
  subscribe: () => void
  unsubscribe: () => void
  getSubscriptionCount: () => number
}

export function createDashboardChannelManager(
  supabase: SupabaseClient,
  locationId: string,
  handlers: DashboardChannelHandlers,
): DashboardChannelManager {
  let channel: RealtimeChannel | null = null
  let backoffMs = 1_000
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let disposed = false

  const clearReconnectTimer = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
  }

  const scheduleReconnect = () => {
    if (disposed) {
      return
    }

    clearReconnectTimer()
    handlers.onStatusChange('reconnecting')
    recordDashboardReconnectAttempt()
    reconnectTimer = setTimeout(() => {
      subscribeInternal()
      backoffMs = Math.min(backoffMs * 2, MAX_BACKOFF_MS)
    }, backoffMs)
  }

  const subscribeInternal = () => {
    if (disposed) {
      return
    }

    if (channel) {
      void supabase.removeChannel(channel)
      channel = null
    }

    handlers.onStatusChange('connecting')
    const topic = buildDashboardTopic(locationId)

    channel = supabase.channel(topic, {
      config: { private: true },
    })

    channel.on('broadcast', { event: DASHBOARD_BROADCAST_EVENT }, ({ payload }) => {
      recordDashboardInvalidation(payload)
      const parsed = parseDashboardInvalidatePayload(payload)
      if (parsed) {
        handlers.onInvalidate(parsed)
      }
    })

    channel.subscribe((status) => {
      if (disposed) {
        return
      }

      if (status === 'SUBSCRIBED') {
        backoffMs = 1_000
        recordDashboardSubscriptionCount(1)
        handlers.onStatusChange('live')
        return
      }

      if (
        status === 'CHANNEL_ERROR' ||
        status === 'TIMED_OUT' ||
        status === 'CLOSED'
      ) {
        handlers.onStatusChange('error')
        scheduleReconnect()
      }
    })
  }

  return {
    subscribe: subscribeInternal,
    unsubscribe: () => {
      disposed = true
      clearReconnectTimer()
      if (channel) {
        void supabase.removeChannel(channel)
        channel = null
      }
      recordDashboardSubscriptionCount(0)
    },
    getSubscriptionCount: () => (channel ? 1 : 0),
  }
}
