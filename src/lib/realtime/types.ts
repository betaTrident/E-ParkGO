import type { DashboardInvalidatePayload } from '@/features/dashboard/types'

export const DASHBOARD_BROADCAST_EVENT = 'dashboard_invalidate' as const

export function buildDashboardTopic(locationId: string): string {
  return `location:${locationId}:dashboard`
}

export function parseDashboardInvalidatePayload(
  payload: unknown,
): DashboardInvalidatePayload | null {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const record = payload as Record<string, unknown>
  const domain = record.domain
  const aggregateVersion = record.aggregate_version

  if (
    domain !== 'spaces' &&
    domain !== 'sessions' &&
    domain !== 'payments'
  ) {
    return null
  }

  if (typeof aggregateVersion !== 'number' || !Number.isFinite(aggregateVersion)) {
    return null
  }

  return {
    domain,
    aggregate_version: aggregateVersion,
  }
}
