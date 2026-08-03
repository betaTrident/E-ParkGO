import { describe, expect, it, beforeEach } from 'vitest'

import {
  getDashboardTelemetry,
  recordDashboardCanonicalRefetch,
  recordDashboardInvalidation,
  recordDashboardSubscriptionCount,
  resetDashboardTelemetry,
} from '@/lib/realtime/dashboard-telemetry'

describe('dashboard telemetry', () => {
  beforeEach(() => {
    resetDashboardTelemetry()
  })

  it('tracks subscription count and small invalidation payloads', () => {
    recordDashboardSubscriptionCount(1)
    recordDashboardInvalidation({ domain: 'sessions', aggregate_version: 4 })

    const snapshot = getDashboardTelemetry()
    expect(snapshot.activeSubscriptions).toBe(1)
    expect(snapshot.invalidationEvents).toBe(1)
    expect(snapshot.lastInvalidationPayloadBytes).toBeLessThan(80)
  })

  it('records canonical refetch convergence timing', () => {
    recordDashboardCanonicalRefetch(42)
    expect(getDashboardTelemetry().lastConvergenceMs).toBe(42)
    expect(getDashboardTelemetry().canonicalRefetches).toBe(1)
  })
})
