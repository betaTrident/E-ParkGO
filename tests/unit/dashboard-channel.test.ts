import { describe, expect, it, vi } from 'vitest'

import {
  buildDashboardTopic,
  parseDashboardInvalidatePayload,
} from '@/lib/realtime/types'
import { createDashboardChannelManager } from '@/lib/realtime/dashboard-channel'

describe('dashboard realtime channel', () => {
  it('builds the location-scoped topic', () => {
    expect(buildDashboardTopic('11111111-1111-4111-8111-111111111111')).toBe(
      'location:11111111-1111-4111-8111-111111111111:dashboard',
    )
  })

  it('accepts only safe invalidation payloads', () => {
    expect(
      parseDashboardInvalidatePayload({
        domain: 'sessions',
        aggregate_version: 3,
      }),
    ).toEqual({ domain: 'sessions', aggregate_version: 3 })

    expect(parseDashboardInvalidatePayload({ domain: 'spaces', extra: true })).toBeNull()
    expect(parseDashboardInvalidatePayload(null)).toBeNull()
  })

  it('unsubscribes without mutating supabase state', () => {
    const removeChannel = vi.fn().mockResolvedValue('ok')
    const channel = {
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    }

    const supabase = {
      channel: vi.fn().mockReturnValue(channel),
      removeChannel,
    }

    const onInvalidate = vi.fn()
    const manager = createDashboardChannelManager(
      supabase as never,
      '11111111-1111-4111-8111-111111111111',
      {
        onInvalidate,
        onStatusChange: vi.fn(),
      },
    )

    manager.subscribe()
    expect(supabase.channel).toHaveBeenCalledWith(
      'location:11111111-1111-4111-8111-111111111111:dashboard',
      { config: { private: true } },
    )

    manager.unsubscribe()
    expect(removeChannel).toHaveBeenCalled()
    expect(manager.getSubscriptionCount()).toBe(0)
  })

  it('forwards valid broadcast payloads and reconnects on channel errors', () => {
    vi.useFakeTimers()
    const removeChannel = vi.fn().mockResolvedValue('ok')
    let broadcastHandler: ((payload: { payload: unknown }) => void) | undefined
    let statusHandler: ((status: string) => void) | undefined
    const channel = {
      on: vi.fn((_event: string, _filter: unknown, handler: (payload: { payload: unknown }) => void) => {
        broadcastHandler = handler
        return channel
      }),
      subscribe: vi.fn((handler: (status: string) => void) => {
        statusHandler = handler
      }),
    }

    const supabase = {
      channel: vi.fn().mockReturnValue(channel),
      removeChannel,
    }

    const onInvalidate = vi.fn()
    const onStatusChange = vi.fn()
    const manager = createDashboardChannelManager(
      supabase as never,
      '11111111-1111-4111-8111-111111111111',
      {
        onInvalidate,
        onStatusChange,
      },
    )

    manager.subscribe()
    statusHandler?.('SUBSCRIBED')
    broadcastHandler?.({
      payload: { domain: 'sessions', aggregate_version: 4 },
    })

    expect(onStatusChange).toHaveBeenCalledWith('live')
    expect(onInvalidate).toHaveBeenCalledWith({
      domain: 'sessions',
      aggregate_version: 4,
    })

    statusHandler?.('CHANNEL_ERROR')
    expect(onStatusChange).toHaveBeenCalledWith('error')
    vi.runOnlyPendingTimers()
    expect(onStatusChange).toHaveBeenCalledWith('reconnecting')

    manager.unsubscribe()
    vi.useRealTimers()
  })

  it('handles timeout closures with reconnect scheduling', () => {
    vi.useFakeTimers()
    const removeChannel = vi.fn().mockResolvedValue('ok')
    let statusHandler: ((status: string) => void) | undefined
    const channel = {
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn((handler: (status: string) => void) => {
        statusHandler = handler
      }),
    }

    const supabase = {
      channel: vi.fn().mockReturnValue(channel),
      removeChannel,
    }

    const onStatusChange = vi.fn()
    const manager = createDashboardChannelManager(
      supabase as never,
      '11111111-1111-4111-8111-111111111111',
      {
        onInvalidate: vi.fn(),
        onStatusChange,
      },
    )

    manager.subscribe()
    statusHandler?.('TIMED_OUT')

    expect(onStatusChange).toHaveBeenCalledWith('error')
    vi.runOnlyPendingTimers()
    expect(onStatusChange).toHaveBeenCalledWith('reconnecting')

    manager.unsubscribe()
    vi.useRealTimers()
  })
})
