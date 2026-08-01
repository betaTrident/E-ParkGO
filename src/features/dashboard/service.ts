import type { DashboardSnapshot } from '@/features/dashboard/types'
import { createServerSupabaseClient } from '@/lib/supabase/server'

function isDashboardMetrics(value: unknown): value is DashboardSnapshot['metrics'] {
  if (!value || typeof value !== 'object') {
    return false
  }

  const record = value as Record<string, unknown>
  return (
    typeof record.car_capacity === 'number' &&
    typeof record.car_occupied === 'number' &&
    typeof record.motorcycle_capacity === 'number' &&
    typeof record.motorcycle_occupied === 'number' &&
    typeof record.active_sessions === 'number'
  )
}

function isDashboardSnapshot(value: unknown): value is DashboardSnapshot {
  if (!value || typeof value !== 'object') {
    return false
  }

  const record = value as Record<string, unknown>
  return (
    typeof record.snapshot_at === 'string' &&
    typeof record.business_date === 'string' &&
    typeof record.aggregate_version === 'number' &&
    typeof record.location_id === 'string' &&
    isDashboardMetrics(record.metrics)
  )
}

export async function fetchDashboardSnapshot(
  businessDate?: string,
): Promise<DashboardSnapshot | null> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc('get_dashboard_snapshot', {
    ...(businessDate ? { p_business_date: businessDate } : {}),
  })

  if (error || !data) {
    console.error('Dashboard snapshot RPC failed', { code: error?.code })
    return null
  }

  if (!isDashboardSnapshot(data)) {
    console.error('Dashboard snapshot RPC returned unexpected shape')
    return null
  }

  return data
}
